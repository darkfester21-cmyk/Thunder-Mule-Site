const Omise = require('omise');

module.exports = async (req, res) => {
  // 1. Updated CORS headers to match your domain (no 'www')
  res.setHeader('Access-Control-Allow-Origin', 'https://thundermulecoffee.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 2. Handle preflight OPTIONS request (Crucial for Vercel/Browsers)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Ensure only POST requests can process payments
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, amount, orderData } = req.body;

  // 4. Basic validation
  if (!token || !amount) {
    return res.status(400).json({ error: 'Missing token or amount' });
  }

  // 5. Initialize Omise with your Secret Key from Vercel Environment Variables
  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  try {
    // 6. Create the charge
    const charge = await omise.charges.create({
      amount: amount, // Amount in sub-units (e.g., 30000 for 300 THB)
      currency: 'THB',
      card: token,
      description: `Thunder Mule Order - ${orderData?.name || 'Customer'}`,
      metadata: orderData
    });

    // 7. Success response
    res.status(200).json({
      status: 'successful',
      chargeId: charge.id,
      amount: charge.amount / 100
    });
  } catch (error) {
    console.error('Omise Error:', error);
    res.status(500).json({ status: 'failed', error: error.message });
  }
};
