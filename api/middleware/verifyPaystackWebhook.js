// =============================================================================
// PAYSTACK WEBHOOK SIGNATURE VERIFICATION
// Ensures incoming webhook requests actually originate from Paystack by
// validating the HMAC SHA-512 signature in the x-paystack-signature header.
// =============================================================================
const crypto = require('crypto');

/**
 * Express middleware: verifyPaystackWebhook
 *
 * IMPORTANT: This middleware requires express.json() with `verify` option
 * to preserve the raw request body. See server.js for setup.
 *
 * Flow:
 *   1. Read the x-paystack-signature header from the request.
 *   2. Compute HMAC SHA-512 of the raw body using our Paystack secret key.
 *   3. Compare signatures — reject if they don't match.
 */
const verifyPaystackWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      console.warn('[WEBHOOK] Missing x-paystack-signature header');
      return res.status(401).json({ error: 'Missing webhook signature.' });
    }

    // Compute the expected signature from the raw request body
    const expectedSignature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('[WEBHOOK] Invalid signature — possible spoofed request');
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    // Signature valid — proceed
    next();
  } catch (err) {
    console.error('[WEBHOOK] Error verifying signature:', err);
    return res.status(500).json({ error: 'Webhook verification error.' });
  }
};

module.exports = verifyPaystackWebhook;
