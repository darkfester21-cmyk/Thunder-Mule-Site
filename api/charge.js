const Omise = require('omise');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { omise_token, omise_source, amount, description } = req.body || {};

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
      return_uri: 'https://thundermulecoffee.com/thank-you.html'
    });

    // If PromptPay or 3DS - redirect to Omise page (should show QR code)
    if (charge.authorize_uri) {
      res.writeHead(302, { Location: charge.authorize_uri });
      return res.end();
    }

    // Successful card payment - go to thank you page
    res.writeHead(302, { Location: '/thank-you.html' });
    return res.end();

  } catch (error) {
    console.error('Omise Charge Error:', error.message);
    // On error, redirect back to home with a simple message (we can improve later)
    res.writeHead(302, { Location: '/?payment=failed' });
    return res.end();
  }
};
