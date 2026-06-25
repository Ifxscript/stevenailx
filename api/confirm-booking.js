import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { reference, bookingId } = req.body || {};
  if (!reference || !bookingId) {
    return res.status(400).json({ error: 'Missing reference or bookingId' });
  }

  try {
    // 1. Verify payment with Paystack using the secret key (never exposed to client)
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return res.status(200).json({ confirmed: false, reason: 'payment_not_successful' });
    }

    const amountPaid = paystackData.data.amount / 100; // Paystack stores in kobo

    // 2. Load the booking from Firestore server-side
    const db = getDb();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingSnap.data();

    // Idempotent — already confirmed, don't double-process
    if (booking.status === 'confirmed') {
      return res.status(200).json({ confirmed: true });
    }

    // 3. Reference must match what we stored when the booking was created
    if (booking.paystackReference !== reference) {
      console.error(`[confirm-booking] Reference mismatch: stored=${booking.paystackReference} received=${reference}`);
      return res.status(400).json({ error: 'Reference mismatch' });
    }

    // 4. Amount paid must cover the deposit the client selected
    if (amountPaid < booking.depositAmount) {
      console.error(`[confirm-booking] Underpayment: paid=${amountPaid} required=${booking.depositAmount}`);
      return res.status(400).json({ error: 'Insufficient payment', amountPaid, required: booking.depositAmount });
    }

    // 5. Write confirmation — Admin SDK bypasses Firestore security rules, client SDK cannot do this
    await bookingRef.update({
      status: 'confirmed',
      paymentStatus: 'deposit_paid',
      amountPaid,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ confirmed: true, amountPaid });
  } catch (err) {
    console.error('[confirm-booking]', err);
    return res.status(500).json({ error: 'Confirmation failed' });
  }
}
