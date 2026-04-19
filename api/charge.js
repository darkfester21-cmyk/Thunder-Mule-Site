const omise = require('omise')({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: '2019-05-29'
});

// Helper to read form data without body-parser
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. Parse the data
  const body = await getBody(req);
  const { omise_token, omise_source, amount, description } = body;

  try {
    // 2. Create the charge
    const charge = await omise.charges.create({
      amount: parseInt(amount),
      currency: 'THB',
      description: description || 'Thunder Mule Coffee',
      [omise_token ? 'card' : 'source']: omise_token || omise_source,
      return_uri: 'https://thundermulecoffee.com'
    });

    // 3. Handle Redirect (PromptPay)
    if (charge.authorize_uri) {
      res.writeHead(302, { Location: charge.authorize_uri });
      return res.end();
    }

    // 4. Handle Success (Card)
    res.writeHead(302, { Location: 'https://thundermulecoffee.com' });
    return res.end();

  } catch (error) {
    console.error("Omise Error:", error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
};
