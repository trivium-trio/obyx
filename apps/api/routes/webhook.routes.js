// PAYSTACK WEBHOOK HANDLER
import { Router } from 'express';
import { Transaction, User } from '../models/index.js';
import { sendUSDC } from '../services/circle.service.js';
import verifyPaystackWebhook from '../middleware/verifyPaystackWebhook.js';

const router = Router();

/*
// POST /api/v1/webhooks/paystack
// Paystack sends a POST request here when a payment event occurs.
//
// Flow for a successful charge:
//   1. Verify webhook signature (middleware)
//   2. Extract the event type and payment reference
//   3. Find the matching transaction in our DB
//   4. Update status to FIAT_RECEIVED
//   5. Call Circle to send USDC to the user's wallet
//   6. Update status to COMPLETED with the on-chain txHash
IMPORTANT: Always respond 200 quickly — Paystack retries on timeout.
*/

/**
 * @openapi
 * /webhooks/paystack:
 *   post:
 *     summary: Paystack payment webhook
 *     description: >
 *       Receives verified Paystack webhook events for payment processing.
 *       On a successful charge, the system updates the transaction status,
 *       triggers a USDC disbursement via Circle, and records the on-chain
 *       transaction hash. Always responds 200 immediately to prevent
 *       Paystack retries.
 *     tags:
 *       - Webhooks
 *     responses:
 *       200:
 *         description: Webhook acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 */
import { reconcilePaid, reconcileFailed } from '../services/reconciliation.service.js';

router.post('/paystack', verifyPaystackWebhook, async (req, res) => {
  // Always acknowledge receipt immediately to prevent Paystack retries.
  res.status(200).json({ received: true });

  try {
    const event = req.body;
    const paymentData = event.data;
    if (!paymentData || !paymentData.reference) return;

    const reference = paymentData.reference;

    if (event.event === 'charge.success') {
      console.log(`[WEBHOOK] charge.success received for ${reference}`);
      // The reconciliation service handles the idempotent DB transition
      await reconcilePaid(reference);
    } else if (event.event === 'charge.failed') {
      console.log(`[WEBHOOK] charge.failed received for ${reference}`);
      const reason = paymentData.gateway_response || 'Charge failed';
      await reconcileFailed(reference, reason);
    } else {
      console.log(`[WEBHOOK] Ignoring event type: ${event.event}`);
    }
  } catch (err) {
    console.error('[WEBHOOK] Unexpected error processing webhook:', err);
  }
});

/**
 * @openapi
 * /webhooks/circle:
 *   post:
 *     summary: Circle Webhook handler
 *     description: Handles outbound transaction state changes from Circle
 *     tags:
 *       - Webhooks
 */
router.post('/circle', async (req, res) => {
  res.status(200).send('OK'); // Acknowledge immediately

  try {
    const event = req.body;
    
    // Check if it's an outbound transaction update
    if (event.notificationType === 'transactions.outbound') {
      const txId = event.transaction?.id;
      const state = event.transaction?.state;
      const txHash = event.transaction?.txHash;

      if (!txId) return;

      const transaction = await Transaction.findOne({ where: { circleTxId: txId } });
      if (!transaction) return;

      if (state === 'COMPLETE') {
        await transaction.update({
          status: 'COMPLETED',
          txHash: txHash || transaction.txHash
        });
        console.log(`[CIRCLE_WEBHOOK] Transaction ${transaction.id} COMPLETED | txHash: ${txHash}`);
      } else if (state === 'FAILED') {
        await transaction.update({ status: 'FAILED' });
        console.error(`[CIRCLE_WEBHOOK] Transaction ${transaction.id} FAILED in Circle`);
      }
    }
  } catch (err) {
    console.error('[CIRCLE_WEBHOOK] Error:', err);
  }
});

export default router;
