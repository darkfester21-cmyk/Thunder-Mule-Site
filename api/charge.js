const Omise = require('omise');

module.exports = async (req, res) => {
  const omise = Omise({
    secretKey: process.env.OMISE_SECRET_KEY
  });

  const { token, source, amount, orderData } = req.body;

  try {
    const charge = await omise.charges.create({
      amount: amount,
      currency: 'THB',
       card: token && token.startsWith('tok_') ? token : undefined,
      source: source || (token && token.startsWith('src_') ? token : undefined),
      description: `Order for ${orderData?.email || 'Guest'}`,
      return_uri: 'https://thundermulecoffee.com',
      metadata: orderData
    });


    res.status(200).json({
      status: charge.status,
      chargeId: charge.id,
      authorize_uri: charge.authorize_uri
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'failed', error: error.message });
  }
};
