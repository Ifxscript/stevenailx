const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

const ADMIN_EMAIL = 'ianekwe7@gmail.com';

/* ─── helpers ────────────────────────────────────────────── */
const fmt = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const fmtTime = (t) => {
  if (!t) return t;
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const price = (n) => `₦${Number(n || 0).toLocaleString()}`;
const serviceList = (svcs) => (svcs || []).map(s => s.name).join(', ');

const mail = (to, subject, html) => db.collection('mail').add({ to, message: { subject, html } });

/* ─── 1. New booking created ─────────────────────────────── */
exports.onBookingCreated = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const booking = event.data?.data();
  if (!booking) return;

  // Only handle pending bookings (the new flow)
  // Legacy confirmed bookings (old flow) are handled by the status update trigger below
  if (booking.status !== 'pending') return;

  try {
    await Promise.all([
      // Tell the client their request was received
      mail(booking.clientEmail, 'Booking request received — SteveNailX', `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#c94b35">Request Received</h2>
          <p>Hi ${booking.clientName},</p>
          <p>We've received your booking request for <strong>${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</strong>.</p>
          <p>Steve will review it shortly. You'll get a confirmation email as soon as it's accepted.</p>
          <div style="background:#f9f7f2;padding:16px;border-radius:8px;margin:20px 0">
            <p><strong>Services:</strong> ${serviceList(booking.services)}</p>
            <p><strong>Total:</strong> ${price(booking.totalPrice)}</p>
            <p><strong>Location:</strong> Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja</p>
          </div>
        </div>
      `),

      // Alert Steve there's a new request
      mail(ADMIN_EMAIL, `New booking request — ${booking.clientName} (${fmt(booking.date)})`, `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#c94b35">New Booking Request</h2>
          <div style="background:#f4f4f4;padding:16px;border-radius:8px;margin:16px 0">
            <p><strong>Client:</strong> ${booking.clientName}</p>
            <p><strong>Email:</strong> ${booking.clientEmail}</p>
            <p><strong>Phone:</strong> ${booking.clientPhone || 'Not provided'}</p>
            <p><strong>Date:</strong> ${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</p>
            <p><strong>Services:</strong> ${serviceList(booking.services)}</p>
            <p><strong>Total:</strong> ${price(booking.totalPrice)}</p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
          <p><a href="https://stevenailx.com/admin/operations" style="background:#18130e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:99px;display:inline-block">Review Request →</a></p>
        </div>
      `)
    ]);
  } catch (err) {
    console.error('onBookingCreated email error:', err);
  }
});

/* ─── 2. Booking status changed ──────────────────────────── */
exports.onBookingUpdated = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const before = event.data?.before?.data();
  const after  = event.data?.after?.data();
  if (!before || !after) return;

  const prevStatus = before.status;
  const newStatus  = after.status;

  // Only act when status actually changes
  if (prevStatus === newStatus) return;

  const b = after;

  try {
    if (newStatus === 'confirmed') {
      // Steve accepted — tell the client
      await mail(b.clientEmail, 'Booking confirmed — SteveNailX 💅', `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#1a9e5a">Booking Confirmed!</h2>
          <p>Hi ${b.clientName},</p>
          <p>Your appointment is confirmed. See you on <strong>${fmt(b.date)} at ${fmtTime(b.timeSlot)}</strong>!</p>
          <div style="background:#f0faf5;padding:16px;border-radius:8px;margin:20px 0">
            <p><strong>Services:</strong> ${serviceList(b.services)}</p>
            <p><strong>Total:</strong> ${price(b.totalPrice)}</p>
            <p><strong>Location:</strong> Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja</p>
          </div>
          <p style="font-size:0.9em;color:#666">Need to cancel or reschedule? Please let us know at least 24 hours in advance.</p>
        </div>
      `);
    }

    if (newStatus === 'cancelled' && prevStatus === 'pending') {
      // Steve rejected a request — tell the client
      await mail(b.clientEmail, 'Booking request update — SteveNailX', `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#c94b35">Request Not Accepted</h2>
          <p>Hi ${b.clientName},</p>
          <p>Unfortunately your booking request for <strong>${fmt(b.date)} at ${fmtTime(b.timeSlot)}</strong> could not be accepted at this time.</p>
          <p>Please try selecting a different date, or contact us directly via WhatsApp.</p>
        </div>
      `);
    }

    if (newStatus === 'completed') {
      // Appointment done — thank the client
      await mail(b.clientEmail, 'Thank you for visiting SteveNailX ✨', `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#c94b35">We hope you love your nails!</h2>
          <p>Hi ${b.clientName},</p>
          <p>Your appointment on <strong>${fmt(b.date)}</strong> is now complete. Thank you for visiting SteveNailX!</p>
          <p>We'd love to hear what you think — log in to your dashboard to leave a review.</p>
        </div>
      `);
    }
  } catch (err) {
    console.error('onBookingUpdated email error:', err);
  }
});
