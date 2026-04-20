const Omise = require('omise');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = req.body;   // Vercel/Node now parses JSON automatically in most cases
  } catch (e) {
    body = {};
  }

  const { omise_token, omise_source, amount, description } = body;

  if (!amount || (!omise_token && !omise_source)) {
    return res.status(400).json({ error: 'Missing amount or payment ID' });
  }

  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  try {
    const charge = await omise.charges.create({
      amount: parseInt(amount),
      currency: 'THB',
      card: omise_token || undefined,
      source: omise_source || undefined,
      description: description || 'Thunder Mule Coffee Order',
      return_uri: 'https://thundermulecoffee.com'
    });

    if (charge.authorize_uri) {
      res.writeHead(302, { Location: charge.authorize_uri });
      return res.end();
    }

    res.status(200).json({ status: 'successful', chargeId: charge.id });

  } catch (error) {
    console.error('Omise Charge Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
