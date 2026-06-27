import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore('stevenailx');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.SEND_EMAIL_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Primary: Firestore
  try {
    const db = getDb();
    const snap = await db.collection('bookings')
      .where('status', 'in', ['confirmed', 'completed'])
      .get();

    const payments = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        orderId: data.orderId || d.id,
        clientName: data.clientName || '',
        clientEmail: data.clientEmail || '',
        amountPaid: data.depositAmount || 0,
        totalPrice: data.totalPrice || 0,
        depositOption: data.depositOption || '',
        paystackReference: data.paystackReference || '',
        status: data.status || '',
        appointmentDate: data.date || '',
        paidAt: data.updatedAt || data.createdAt || '',
        services: (data.services || []).map(s => s.name).join(', '),
      };
    });

    return res.status(200).json({ payments, source: 'firestore' });
  } catch (firestoreErr) {
    console.error('[payment-history] Firestore failed, trying Paystack:', firestoreErr.message);
  }

  // Fallback: Paystack transactions API
  try {
    const r = await fetch('https://api.paystack.co/transaction?perPage=200&status=success', {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await r.json();
    if (!data.status) throw new Error(data.message || 'Paystack error');

    const payments = (data.data || []).map(txn => ({
      id: txn.reference,
      orderId: txn.reference,
      clientName: txn.customer?.first_name
        ? `${txn.customer.first_name} ${txn.customer.last_name || ''}`.trim()
        : txn.customer?.email || '',
      clientEmail: txn.customer?.email || '',
      amountPaid: txn.amount / 100,
      totalPrice: txn.amount / 100,
      depositOption: '',
      paystackReference: txn.reference,
      status: 'confirmed',
      appointmentDate: '',
      paidAt: txn.paid_at || '',
      services: '',
    }));

    return res.status(200).json({ payments, source: 'paystack' });
  } catch (paystackErr) {
    console.error('[payment-history] Paystack fallback failed:', paystackErr.message);
    return res.status(500).json({ error: 'Failed to fetch payment history from all sources' });
  }
}
