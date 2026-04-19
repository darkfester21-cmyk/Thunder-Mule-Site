const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Capture the IDs from the frontend
  const { omise_token, omise_source, amount, description } = req.body;

  try {
    // 2. Create the charge using either card (token) OR source (PromptPay)
    const charge = await omise.charges.create({
      amount: parseInt(amount),
      currency: 'THB',
      description: description || 'Thunder Mule Coffee Order',
      [omise_token ? 'card' : 'source']: omise_token || omise_source,
      // If using PromptPay, we need a return_uri to complete the flow
      return_uri: 'https://thundermulecoffee.com' 
    });

    // 3. If it's PromptPay, send the authorize_uri back so the user sees the QR code
    if (charge.authorize_uri) {
        return res.redirect(charge.authorize_uri);
    }

    res.status(200).json({ status: 'successful', charge_id: charge.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
