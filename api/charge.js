const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'
});

// Helper to read form data from the frontend
const getBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const data = {};
    for (const [key, value] of params) { data[key] = value; }
    resolve(data);
  });
});

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Parse the incoming data (amount, token/source, etc.)
    const body = await getBody(req);
    const { omise_token, omise_source, amount, description } = body;

    // 2. Create the charge with Omise
    const charge = await omise.charges.create({
      amount: parseInt(amount),
      currency: 'THB',
      description: description || 'Thunder Mule Coffee Order',
      // Automatically uses 'card' for tokens and 'source' for PromptPay
      [omise_token ? 'card' : 'source']: omise_token || omise_source,
      // After payment is done, send them here
      return_uri: 'https://thundermulecoffee.com'
    });

    // 3. Handle PromptPay (Requires QR code redirect)
    if (charge.authorize_uri) {
      res.writeHead(302, { Location: charge.authorize_uri });
      return res.end();
    }

    // 4. Handle Credit Card (Success redirect)
    res.writeHead(302, { Location: 'https://thundermulecoffee.com' });
    return res.end();

  } catch (error) {
    console.error("Omise Charge Error:", error.message);
    // If it fails, show the error clearly on the page
    res.status(500).send(`Payment Processing Error: ${error.message}`);
  }
};
