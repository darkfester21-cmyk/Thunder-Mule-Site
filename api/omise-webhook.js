const crypto = require('crypto');
const { Resend } = require('resend');

const OMISE_WEBHOOK_SECRET = process.env.OMISE_WEBHOOK_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const YOUR_EMAIL = 'huathongbrand@gmail.com';   // ← Change this if you want notifications to a different email

const resend = new Resend(RESEND_API_KEY);

function sendAlertConsole(message) {
  console.log('=== OMISE PAYMENT ALERT ===');
  console.log(message);
  console.log('==========================');
}

async function sendEmailAlert(subject, htmlContent) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not set - falling back to console only');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Thunder Mule Coffee <noreply@thundermulecoffee.com>',
      to: [YOUR_EMAIL],
      subject: subject,
      html: htmlContent,
    });
    console.log('✅ Email alert sent successfully to', YOUR_EMAIL);
  } catch (emailError) {
    console.error('❌ Failed to send email:', emailError.message);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const rawBody = req.body ? JSON.stringify(req.body) : '';
  const signature = req.headers['omise-signature'];

  // Signature verification
  if (signature && OMISE_WEBHOOK_SECRET) {
    const expectedSignature = crypto
      .createHmac('sha256', OMISE_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Webhook: Invalid signature');
      return res.status(401).end('Invalid signature');
    }
  } else {
    console.warn('Webhook: Signature check skipped (no secret provided)');
  }

  const event = req.body;

  try {
    if (event.key === 'charge.complete' || event.key === 'charge.successful') {
      const charge = event.data;

      if (charge.status === 'successful') {
        const amountTHB = (charge.amount / 100).toFixed(2);
        const paymentMethod = charge.source 
          ? charge.source.type 
          : (charge.card ? 'credit_card' : 'unknown');

        const subject = `✅ New Payment Received - ${amountTHB} THB`;
        const html = `
          <h2>✅ Successful Payment - Thunder Mule Coffee</h2>
          <p><strong>Amount:</strong> ${amountTHB} THB</p>
          <p><strong>Charge ID:</strong> ${charge.id}</p>
          <p><strong>Description:</strong> ${charge.description || 'No description'}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p><strong>Created:</strong> ${new Date(charge.created_at * 1000)}</p>
          <hr>
          <p>This is an automated notification from your Thunder Mule Coffee site.</p>
        `;

        sendAlertConsole(`Successful payment: ${amountTHB} THB - ${charge.id}`);
        await sendEmailAlert(subject, html);

      } else if (charge.status === 'failed') {
        const subject = `❌ Payment Failed - ${charge.id}`;
        const html = `
          <h2>❌ Payment Failed</h2>
          <p><strong>Charge ID:</strong> ${charge.id}</p>
          <p><strong>Reason:</strong> ${charge.failure_code || 'Unknown'} - ${charge.failure_message || 'No message'}</p>
          <p><strong>Description:</strong> ${charge.description || 'No description'}</p>
        `;

        sendAlertConsole(`Failed payment: ${charge.id}`);
        await sendEmailAlert(subject, html);
      }
    }

    // Always return 200 to Omise
    res.status(200).end();
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end('Internal Server Error');
  }
};
