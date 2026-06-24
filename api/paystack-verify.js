export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: 'Missing reference' });

  try {
    const r = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = await r.json();

    if (!data.status) {
      return res.status(400).json({ error: data.message || 'Verification failed' });
    }

    const txn = data.data;
    res.status(200).json({
      verified: txn.status === 'success',
      status: txn.status,
      amountPaid: txn.amount / 100,
      reference: txn.reference,
    });
  } catch (err) {
    console.error('[paystack-verify]', err);
    res.status(500).json({ error: 'Verification error' });
  }
}
