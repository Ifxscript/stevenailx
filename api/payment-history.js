export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const secret = process.env.SEND_EMAIL_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const r = await fetch('https://api.paystack.co/transaction?perPage=200&status=success', {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await r.json();
    if (!data.status) throw new Error(data.message || 'Paystack error');

    const payments = (data.data || []).map(txn => ({
      id: txn.reference,
      orderId: txn.metadata?.orderId || txn.reference,
      clientName: txn.customer?.first_name
        ? `${txn.customer.first_name} ${txn.customer.last_name || ''}`.trim()
        : txn.customer?.email || '',
      clientEmail: txn.customer?.email || '',
      amountPaid: txn.amount / 100,
      paystackReference: txn.reference,
      status: txn.status,
      paidAt: txn.paid_at || '',
      channel: txn.channel || '',
    }));

    return res.status(200).json({ payments });
  } catch (err) {
    console.error('[payment-history]', err.message);
    return res.status(500).json({ error: 'Failed to fetch payment history from Paystack' });
  }
}
