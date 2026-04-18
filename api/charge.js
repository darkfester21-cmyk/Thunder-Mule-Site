const Omise = require('omise');

module.exports = async (req, res) => {
  // 1. CORS headers to allow your frontend to talk to this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle browser preflight checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 4. Get data from frontend (accepts either token for cards or source for PromptPay)
  const { token, source, amount, orderData } = req.body;

  // 5. Validation: Ensure we have an amount AND a payment method
  if ((!token && !source) || !amount) {
    return res.status(400).json({ error: 'Missing payment method (token/source) or amount' });
  }

  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  try {
    // 6. Create the charge with Omise
    const charge = await omise.charges.create({
      amount: amount,
      currency: 'THB',
      card: token || undefined,   // Used if payment is Credit Card
      source: source || undefined, // Used if payment is PromptPay
      description: `Thunder Mule Order - ${orderData?.name || 'Customer'}`,
      metadata: orderData,
      // REQUIRED for PromptPay: Redirects user back to your site after payment
      return_uri: 'https://vercel.app' 
    });

    // 7. Send success response back to frontend
    res.status(200).json({
      status: charge.status, // will be 'successful' for cards or 'pending' for PromptPay
      chargeId: charge.id,
      authorize_uri: charge.authorize_uri, // The URL for the PromptPay QR code
      amount: charge.amount / 100
    });

  } catch (error) {
    console.error('Omise Error:', error);
    res.status(500).json({ status: 'failed', error: error.message });
  }
};
