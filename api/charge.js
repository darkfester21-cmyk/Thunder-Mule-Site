const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'
});

// This helper ensures Vercel reads the form data correctly
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = async (req, res) => {
  // 1. Run the parsers
  await new Promise((resolve) => urlencodedParser(req, res, resolve));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // 2. Get the data (now that it's parsed)
  const { omise_token, omise_source, amount, description } = req.body;

  try {
    const charge = await omise.charges.create({
      amount: parseInt(amount),
      currency: 'THB',
      description: description || 'Thunder Mule Coffee',
      [omise_token ? 'card' : 'source']: omise_token || omise_source,
      return_uri: 'https://thundermulecoffee.com'
    });

    // 3. THE REDIRECT LOGIC (Already in the right place)
    if (charge.authorize_uri) {
      res.writeHead(302, { Location: charge.authorize_uri });
      return res.end();
    }

    res.status(200).json({ status: 'successful', charge_id: charge.id });

  } catch (error) {
    console.error("Omise Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
