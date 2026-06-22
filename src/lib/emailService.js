export const sendBookingEmail = async (type, booking) => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, booking }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('[EmailService] API error:', data.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[EmailService] Failed:', err);
    return false;
  }
};
