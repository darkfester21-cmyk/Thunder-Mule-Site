const Omise = require('omise');

module.exports = async (req, res) => {
  // --- 1. Handle preflight OPTIONS request ---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- 2. Only allow POST requests ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- 3. Extract data from request ---
  const { token, amount, orderData } = req.body;

  if (!token || !amount) {
    return res.status(400).json({ error: 'Missing token or amount' });
  }

  // --- 4. Initialize Omise ---
  // Ensure OMISE_SECRET_KEY is set in your Vercel Environment Variables
  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  try {
    // --- 5. Create the charge ---
    const charge = await omise.charges.create({
      amount: amount, // e.g., 30000 for 300 THB
      currency: 'THB',
      card: token,
      description: `Thunder Mule Order - ${orderData?.name || 'Customer'}`,
      metadata: orderData
    });

    // --- 6. Send success response ---
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
