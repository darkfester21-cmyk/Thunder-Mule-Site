const crypto = require('crypto');

const OMISE_WEBHOOK_SECRET = process.env.OMISE_WEBHOOK_SECRET; // We'll set this later

// Simple alert function (console for now - easy to change to email later)
function sendAlert(message) {
  console.log('=== OMise PAYMENT ALERT ===');
  console.log(message);
  console.log('==========================');
  // TODO: Later add email, Slack, Telegram, etc. here
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // Get raw body for signature verification
  const rawBody = req.body ? JSON.stringify(req.body) : '';

  // Verify Omise signature (recommended)
  const signature = req.headers['omise-signature'];
  if (!signature || !OMISE_WEBHOOK_SECRET) {
    console.warn('Webhook: Missing signature or secret');
    return res.status(401).end();
  }

  const expectedSignature = crypto
    .createHmac('sha256', OMISE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Webhook: Invalid signature');
    return res.status(401).end();
  }

  const event = req.body;

  try {
    if (event.key === 'charge.complete' || event.key === 'charge.successful') {
      const charge = event.data;

      if (charge.status === 'successful') {
        sendAlert(`✅ SUCCESSFUL PAYMENT!\n` +
          `Charge ID: ${charge.id}\n` +
          `Amount: ${(charge.amount / 100).toFixed(2)} THB\n` +
          `Description: ${charge.description}\n` +
          `Payment Method: ${charge.source ? charge.source.type : 'Card'}\n` +
          `Created: ${new Date(charge.created_at)}`);
      } 
      else if (charge.status === 'failed') {
        sendAlert(`❌ PAYMENT FAILED\n` +
          `Charge ID: ${charge.id}\n` +
          `Reason: ${charge.failure_code} - ${charge.failure_message}`);
      }
    } 
    else if (event.key === 'source.chargeable') {
      // Optional: For async sources before charging
      sendAlert(`Source chargeable: ${event.data.id}`);
    }

    // Always return 200 so Omise knows we received it
    res.status(200).end();

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
};
