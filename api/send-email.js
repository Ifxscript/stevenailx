import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'SteveNailX <booking@support.stevenailx.com>';
const FALLBACK_ADMIN = 'ianekwe7@gmail.com';

async function getAdminEmails() {
  try {
    const url =
      'https://firestore.googleapis.com/v1/projects/stevenailx/databases/(default)/documents/site_content/landing_page';
    const res = await fetch(url);
    const data = await res.json();
    const emails =
      data?.fields?.security?.mapValue?.fields?.adminEmails?.arrayValue?.values?.map(
        v => v.stringValue
      ).filter(Boolean) || [];
    return emails.length > 0 ? emails : [FALLBACK_ADMIN];
  } catch {
    return [FALLBACK_ADMIN];
  }
}

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
    const ADMIN_EMAILS = await getAdminEmails();
    const sends = [];

    if (type === 'booking_awaiting_payment') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Booking received — complete your transfer to confirm',
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">Your slot is reserved!</h2>
            <p>Hi ${booking.clientName},</p>
            <p>We've received your booking details for <strong>${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</strong>.</p>
            <p>To confirm your appointment, please complete your bank transfer of <strong>${naira(booking.depositAmount)}</strong> to the account shown in the Paystack window. Your slot will be locked in as soon as the transfer lands.</p>
            ${card(`
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              <p style="margin:0"><strong>Deposit due:</strong> ${naira(booking.depositAmount)}</p>
              <p style="margin:0"><strong>Location:</strong> Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja</p>
            `)}
            <p style="font-size:0.9em;color:#888">Didn't make a booking? You can safely ignore this email.</p>
          `),
        }),
        resend.emails.send({
          from: FROM,
          to: ADMIN_EMAILS,
          subject: `⏳ New booking pending payment — ${booking.clientName} (${fmt(booking.date)})`,
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">Booking Started — Payment Pending</h2>
            <p>A client has started the booking process and is being asked to transfer a deposit.</p>
            ${card(`
              <p style="margin:0"><strong>Client:</strong> ${booking.clientName}</p>
              <p style="margin:0"><strong>Email:</strong> ${booking.clientEmail}</p>
              <p style="margin:0"><strong>Phone:</strong> ${booking.clientPhone || 'Not provided'}</p>
              <p style="margin:0"><strong>Date:</strong> ${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</p>
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              <p style="margin:0"><strong>Deposit requested:</strong> ${naira(booking.depositAmount)}</p>
              ${booking.notes ? `<p style="margin:0"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            `)}
            <p style="font-size:0.9em;color:#888">This booking is <strong>awaiting payment</strong>. You'll get another email once the deposit lands.</p>
            <a href="https://stevenailx.com/admin/operations" style="background:#18130e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:99px;display:inline-block;margin-top:8px">View in Dashboard →</a>
          `),
        })
      );
    }

    if (type === 'booking_paid') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Booking confirmed — deposit received',
          html: wrap(`
            <h2 style="color:#1a9e5a;margin-top:0">You're confirmed!</h2>
            <p>Hi ${booking.clientName},</p>
            <p>Your deposit of <strong>${naira(booking.depositAmount)}</strong> has been received. Your slot is locked in!</p>
            ${card(`
              <p style="margin:0"><strong>Date:</strong> ${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</p>
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              ${booking.totalPrice > booking.depositAmount ? `<p style="margin:0"><strong>Balance due on the day:</strong> ${naira(booking.totalPrice - booking.depositAmount)}</p>` : ''}
              <p style="margin:0"><strong>Location:</strong> Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja</p>
            `)}
            <p style="font-size:0.9em;color:#888">Need to reschedule? Please let us know at least 24 hours in advance.</p>
          `),
        }),
        resend.emails.send({
          from: FROM,
          to: ADMIN_EMAILS,
          subject: `💰 New paid booking — ${booking.clientName} (${fmt(booking.date)})`,
          html: wrap(`
            <h2 style="color:#1a9e5a;margin-top:0">New Paid Booking</h2>
            <p>Deposit received and booking auto-confirmed.</p>
            ${card(`
              <p style="margin:0"><strong>Client:</strong> ${booking.clientName}</p>
              <p style="margin:0"><strong>Email:</strong> ${booking.clientEmail}</p>
              <p style="margin:0"><strong>Phone:</strong> ${booking.clientPhone || 'Not provided'}</p>
              <p style="margin:0"><strong>Date:</strong> ${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</p>
              <p style="margin:0"><strong>Services:</strong> ${svcList(booking.services)}</p>
              <p style="margin:0"><strong>Total:</strong> ${naira(booking.totalPrice)}</p>
              <p style="margin:0"><strong>Deposit paid:</strong> ${naira(booking.depositAmount)}</p>
              ${booking.totalPrice > booking.depositAmount ? `<p style="margin:0"><strong>Balance due:</strong> ${naira(booking.totalPrice - booking.depositAmount)}</p>` : ''}
              ${booking.notes ? `<p style="margin:0"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            `)}
            <a href="https://stevenailx.com/admin/operations" style="background:#18130e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:99px;display:inline-block;margin-top:8px">View in Dashboard →</a>
          `),
        })
      );
    }

    if (type === 'booking_cancelled') {
      sends.push(
        resend.emails.send({
          from: FROM,
          to: booking.clientEmail,
          subject: 'Booking cancelled — SteveNailX',
          html: wrap(`
            <h2 style="color:#c94b35;margin-top:0">Booking Cancelled</h2>
            <p>Hi ${booking.clientName},</p>
            <p>Your booking for <strong>${fmt(booking.date)} at ${fmtTime(booking.timeSlot)}</strong> has been cancelled.</p>
            <p>If you'd like to rebook, visit stevenailx.com or contact us on WhatsApp.</p>
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
