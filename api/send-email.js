import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'SteveNailX <booking@support.stevenailx.com>';
const ADMIN_EMAIL = 'ianekwe7@gmail.com';

const fmt = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return dateStr || ''; }
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const svcList = (svcs) => (svcs || []).map(s => s.name).join(', ') || 'N/A';

const wrap = (body) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a;background:#fff">
    ${body}
    <hr style="border:none;border-top:1px solid #f0efea;margin:32px 0 16px"/>
    <p style="font-size:0.8rem;color:#aaa;margin:0">SteveNailX — Premium Nail Artistry, Abuja</p>
  </div>
`;

const card = (html) => `<div style="background:#f9f7f2;padding:16px;border-radius:8px;margin:20px 0;line-height:1.8">${html}</div>`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, booking } = req.body || {};
  if (!type || !booking) return res.status(400).json({ error: 'Missing type or booking' });

  try {
    const sends = [];

    if (type === 'booking_received') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Booking request received — SteveNailX',
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">Request Received</h2>
            <p>Hi ${booking.clientName},</p>
            <p>We've received your booking request for <strong>${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</strong>.</p>
            <p>Steve will review it shortly and you'll get a confirmation email as soon as it's accepted.</p>
            ${card(`
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              <p style="margin:0"><strong>Location:</strong> Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja</p>
            `)}
          `),
        }),
        resend.emails.send({
          from: FROM,
          to: ADMIN_EMAIL,
          subject: `New booking request — ${booking.clientName} (${fmt(booking.date)})`,
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">New Booking Request</h2>
            ${card(`
              <p style="margin:0"><strong>Client:</strong> ${booking.clientName}</p>
              <p style="margin:0"><strong>Email:</strong> ${booking.clientEmail}</p>
              <p style="margin:0"><strong>Phone:</strong> ${booking.clientPhone || 'Not provided'}</p>
              <p style="margin:0"><strong>Date:</strong> ${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</p>
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              ${booking.notes ? `<p style="margin:0"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            `)}
            <a href="https://stevenailx.com/admin/operations" style="background:#18130e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:99px;display:inline-block;margin-top:8px">Review Request →</a>
          `),
        })
      );
    }

    if (type === 'booking_confirmed') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Booking confirmed — SteveNailX 💅',
          html: wrap(`
            <h2 style="color:#1a9e5a;margin-top:0">Booking Confirmed!</h2>
            <p>Hi ${booking.clientName},</p>
            <p>Your appointment is confirmed. See you on <strong>${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</strong>!</p>
            ${card(`
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              <p style="margin:0"><strong>Location:</strong> Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja</p>
            `)}
            <p style="font-size:0.9em;color:#888">Need to cancel or reschedule? Please let us know at least 24 hours in advance.</p>
          `),
        })
      );
    }

    if (type === 'booking_cancelled') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Booking request update — SteveNailX',
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">Request Not Accepted</h2>
            <p>Hi ${booking.clientName},</p>
            <p>Unfortunately your booking request for <strong>${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</strong> could not be accepted at this time.</p>
            <p>Please try selecting a different date or contact us directly via WhatsApp.</p>
          `),
        })
      );
    }

    if (type === 'booking_completed') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Thank you for visiting SteveNailX ✨',
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">We hope you love your nails!</h2>
            <p>Hi ${booking.clientName},</p>
            <p>Your appointment on <strong>${fmt(booking.date)}</strong> is now complete. Thank you for visiting SteveNailX!</p>
            <p>We'd love to hear what you think — log in to your dashboard to leave a review.</p>
          `),
        })
      );
    }

    if (sends.length === 0) return res.status(400).json({ error: 'Unknown email type' });

    const results = await Promise.allSettled(sends);
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('[send-email] Some emails failed:', failed.map(f => f.reason));
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[send-email] Error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
