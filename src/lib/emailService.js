/**
 * Email notification service using EmailJS.
 * Stub implementation — will be wired up when EmailJS keys are provided.
 * Add to .env: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const isConfigured = () => !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Send booking confirmation email to the client.
 */
export const sendBookingConfirmation = async (booking) => {
  if (!isConfigured()) {
    console.log('[EmailService] Not configured — skipping client email. Booking:', booking.id);
    return false;
  }

  try {
    const { default: emailjs } = await import('@emailjs/browser');
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: booking.clientEmail,
      to_name: booking.clientName,
      booking_date: booking.date,
      booking_time: booking.timeSlot,
      services: booking.services.map(s => s.name).join(', '),
      total_price: `₦${Number(booking.totalPrice).toLocaleString()}`,
      booking_id: booking.id,
    }, PUBLIC_KEY);
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send client email:', err);
    return false;
  }
};

/**
 * Send new booking notification email to Steve.
 */
export const sendNewBookingNotification = async (booking) => {
  if (!isConfigured()) {
    console.log('[EmailService] Not configured — skipping admin notification. Booking:', booking.id);
    return false;
  }

  try {
    const { default: emailjs } = await import('@emailjs/browser');
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: 'ianekwe7@gmail.com',
      to_name: 'Steve',
      booking_date: booking.date,
      booking_time: booking.timeSlot,
      client_name: booking.clientName,
      client_phone: booking.clientPhone || 'Not provided',
      services: booking.services.map(s => `${s.name} (₦${s.price})`).join(', '),
      total_price: `₦${Number(booking.totalPrice).toLocaleString()}`,
      booking_id: booking.id,
    }, PUBLIC_KEY);
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send admin notification:', err);
    return false;
  }
};

/**
 * Send cancellation email.
 */
export const sendCancellationEmail = async (booking) => {
  if (!isConfigured()) {
    console.log('[EmailService] Not configured — skipping cancellation email.');
    return false;
  }

  try {
    const { default: emailjs } = await import('@emailjs/browser');
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: 'ianekwe7@gmail.com',
      to_name: 'Steve',
      subject: 'Booking Cancelled',
      client_name: booking.clientName,
      booking_date: booking.date,
      booking_time: booking.timeSlot,
      booking_id: booking.id,
    }, PUBLIC_KEY);
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send cancellation email:', err);
    return false;
  }
};
