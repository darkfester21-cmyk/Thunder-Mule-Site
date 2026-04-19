const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { omise_token, omise_source, amount, description } = req.body;

  try {
    const charge = await omise.charges.create({
      amount: parseInt(amount),
      currency: 'THB',
      description: description || 'Thunder Mule Coffee',
      // Uses 'card' for tokens, 'source' for PromptPay
      [omise_token ? 'card' : 'source']: omise_token || omise_source,
      // Change this to your actual thank you page URL
      return_uri: 'https://thundermulecoffee.com'
    });

    // CRITICAL: If PromptPay, redirect the user to the QR code page
    if (charge.authorize_uri) {
      res.writeHead(302, { Location: charge.authorize_uri });
      return res.end();
    }

    // For standard card payments that don't need redirect
    res.status(200).json({ status: 'successful', charge_id: charge.id });

  } catch (error) {
    console.error("Omise Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
