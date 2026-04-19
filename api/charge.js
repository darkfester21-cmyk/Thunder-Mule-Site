const Omise = require('omise');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, source, amount, orderData } = req.body;

  if (!amount || (!token && !source)) {
    return res.status(400).json({ error: 'Missing amount or payment token/source' });
  }

  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  try {
    const charge = await omise.charges.create({
      amount: amount,
      currency: 'THB',
      card: token || undefined,
      source: source || undefined,
      description: `Thunder Mule Order - ${orderData?.name || 'Customer'} (${orderData?.email || 'guest'})`,
      metadata: orderData || {}
    });

    res.status(200).json({
      status: 'successful',
      chargeId: charge.id,
      amount: charge.amount / 100,
      authorize_uri: charge.authorize_uri || null
    });
  } catch (error) {
    console.error('Omise Error:', error);
    res.status(500).json({ 
      status: 'failed', 
      error: error.message 
    });
  }
};