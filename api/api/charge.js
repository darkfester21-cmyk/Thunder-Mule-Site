const Omise = require('omise');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, amount, orderData } = req.body;

  if (!token || !amount) {
    return res.status(400).json({ error: 'Missing token or amount' });
  }

  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  try {
    const charge = await omise.charges.create({
      amount: amount,
      currency: 'THB',
      card: token,
      description: `Thunder Mule Order - ${orderData.name} (${orderData.email})`,
      metadata: orderData
    });

    res.status(200).json({
      status: 'successful',
      chargeId: charge.id,
      amount: charge.amount / 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'failed', error: error.message });
  }
};
