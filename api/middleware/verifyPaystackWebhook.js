
// PAYSTACK WEBHOOK SIGNATURE VERIFICATION
// Ensures incoming webhook requests actually originate from Paystack by

import crypto from 'crypto';
import config from '../config/env.js';

const verifyPaystackWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature'];

    if (!signature) {
      console.warn('[WEBHOOK] Missing x-paystack-signature header');
      return res.status(401).json({ error: 'Missing webhook signature.' });
    }

    // Compute the expected signature from the raw request body
    const expectedSignature = crypto
      .createHmac('sha512', config.PAYSTACK_SECRET_KEY)
      .update(req.rawBody || JSON.stringify(req.body))
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

export default verifyPaystackWebhook;
