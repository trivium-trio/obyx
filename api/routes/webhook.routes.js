// =============================================================================
// PAYSTACK WEBHOOK HANDLER
// Receives payment confirmation events from Paystack.
// On successful fiat receipt → triggers Circle USDC disbursement to the user.
//
// This is the critical bridge between fiat payment and crypto delivery.
// =============================================================================
const express = require('express');
const router = express.Router();
const { Transaction, User } = require('../models');
const circleService = require('../services/circle.service');
const verifyPaystackWebhook = require('../middleware/verifyPaystackWebhook');

// ---------------------------------------------------------------------------
// POST /api/webhooks/paystack
// Paystack sends a POST request here when a payment event occurs.
//
// Flow for a successful charge:
//   1. Verify webhook signature (middleware)
//   2. Extract the event type and payment reference
//   3. Find the matching transaction in our DB
//   4. Update status to FIAT_RECEIVED
//   5. Call Circle to send USDC to the user's wallet
//   6. Update status to COMPLETED with the on-chain txHash
//
// IMPORTANT: Always respond 200 quickly — Paystack retries on timeout.
// ---------------------------------------------------------------------------
router.post('/paystack', verifyPaystackWebhook, async (req, res) => {
  // Always acknowledge receipt immediately to prevent Paystack retries.
  // We process asynchronously below.
  res.status(200).json({ received: true });

  try {
    const event = req.body;

    // --- Only process successful charge events ---
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
      const circleResult = await circleService.sendUSDC(
        user.walletAddress,
        parseFloat(transaction.cryptoAmount)
      );

      // --- Step 5: Mark as COMPLETED with the blockchain tx hash ---
      await transaction.update({
        status: 'COMPLETED',
        txHash: circleResult.txHash,
      });

      console.log(`[WEBHOOK] ✅ Transaction ${transaction.id} COMPLETED | txHash: ${circleResult.txHash}`);
    } catch (circleError) {
      // Circle call failed — mark transaction as FAILED for manual review
      console.error(`[WEBHOOK] Circle disbursement failed for tx ${transaction.id}:`, circleError);
      await transaction.update({ status: 'FAILED' });
      // TODO: Queue for retry or alert the operations team
    }
  } catch (err) {
    // We already sent 200, so just log the error for debugging
    console.error('[WEBHOOK] Unexpected error processing webhook:', err);
  }
});

module.exports = router;
