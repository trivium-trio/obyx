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
router.post('/paystack', verifyPaystackWebhook, async (req, res) => {
  // Always acknowledge receipt immediately to prevent Paystack retries.
  // We process asynchronously below.
  res.status(200).json({ received: true });

  try {
    const event = req.body;
    if (event.event !== 'charge.success') {
      console.log(`[WEBHOOK] Ignoring event type: ${event.event}`);
      return;
    }

    const paymentData = event.data;
    const reference = paymentData.reference;

    console.log(`[WEBHOOK] Processing charge.success for reference: ${reference}`);

    // --- Step 1: Find the transaction by Paystack reference ---
    const transaction = await Transaction.findOne({
      where: { paystackReference: reference },
    });

    if (!transaction) {
      console.error(`[WEBHOOK] No transaction found for reference: ${reference}`);
      return;
    }

    // Prevent duplicate processing (idempotency guard)
    if (transaction.status === 'COMPLETED' || transaction.status === 'CRYPTO_PROCESSING') {
      console.warn(`[WEBHOOK] Transaction ${transaction.id} already processed (status: ${transaction.status})`);
      return;
    }

    // --- Step 2: Update status to FIAT_RECEIVED ---
    await transaction.update({ status: 'FIAT_RECEIVED' });
    console.log(`[WEBHOOK] Transaction ${transaction.id} -> FIAT_RECEIVED`);

    // --- Step 3: Fetch the user to get their wallet address ---
    const user = await User.findByPk(transaction.userId);

    if (!user || !user.walletAddress) {
      console.error(`[WEBHOOK] User ${transaction.userId} has no wallet address. Cannot disburse.`);
      await transaction.update({ status: 'FAILED' });
      return;
    }

    // --- Step 4: Send USDC from Treasury to user's wallet ---
    await transaction.update({ status: 'CRYPTO_PROCESSING' });
    console.log(`[WEBHOOK] Sending ${transaction.cryptoAmount} USDC -> ${user.walletAddress}`);

    try {
      // Reuse the transaction's own UUID as the idempotency key — it's already
      // a unique, stable UUIDv4 per row, so retries of this webhook never
      // cause Circle to double-send.
      const circleResult = await sendUSDC(
        user.walletAddress,
        parseFloat(transaction.cryptoAmount),
        transaction.id
      );

      // COMPLETED here means "Circle accepted the transfer" — txHash is not
      // yet available and stays null until a reconciliation job confirms it.
      await transaction.update({
        status: 'COMPLETED',
        circleTransactionId: circleResult.circleTransactionId,
      });

      console.log(`[WEBHOOK] Transaction ${transaction.id} COMPLETED | circleTransactionId: ${circleResult.circleTransactionId}`);
    } catch (circleError) {
      console.error(`[WEBHOOK] Circle disbursement failed for tx ${transaction.id}:`, circleError);
      await transaction.update({
        status: 'FAILED',
        lastError: circleError.message,
      });
    }
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error handling paystack webhook:', error);
  }
});

export default router;