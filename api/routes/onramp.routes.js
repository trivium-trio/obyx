
// ON-RAMP ROUTES
// Handles fiat → crypto conversion flow.
import { Router } from 'express';
import { User, Transaction } from '../models/index.js';
import verifySupabaseToken from '../middleware/verifySupabaseToken.js';
import { initiateSTKPush } from '../services/paystack.service.js';

const router = Router();
const EXCHANGE_RATE = 130.00; // 1 USDC = 130 KES
const MIN_FIAT_AMOUNT = 100;  // Minimum 100 KES (~$0.77)
const MAX_FIAT_AMOUNT = 500000; // Maximum 500,000 KES (~$3,846)
router.post('/init', verifySupabaseToken, async (req, res) => {
  try {
    const { fiatAmount } = req.body;
    const userId = req.user.id;
    if (!fiatAmount || isNaN(fiatAmount) || fiatAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid positive fiatAmount (in KES) is required.',
      });
    }

    const amount = parseFloat(fiatAmount);

    if (amount < MIN_FIAT_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Minimum transaction amount is ${MIN_FIAT_AMOUNT} KES.`,
      });
    }

    if (amount > MAX_FIAT_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Maximum transaction amount is ${MAX_FIAT_AMOUNT} KES.`,
      });
    }

   
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please complete onboarding first.',
      });
    }

    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'No wallet linked. Please connect your MetaMask wallet first.',
      });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'No phone number on file. Please update your profile.',
      });
    }

    // --- Calculate the crypto equivalent ---
    const cryptoAmount = parseFloat((amount / EXCHANGE_RATE).toFixed(6));

    // --- Create a PENDING transaction in the database ---
    const transaction = await Transaction.create({
      userId,
      type: 'ONRAMP',
      status: 'PENDING',
      fiatAmount: amount,
      fiatCurrency: 'KES',
      cryptoAmount,
      cryptoCurrency: 'USDC',
      exchangeRate: EXCHANGE_RATE,
    });

    console.log(`[ONRAMP] Transaction created: ${transaction.id} | ${amount} KES -> ${cryptoAmount} USDC`);

    // --- Trigger the Paystack STK Push ---
    // We use the transaction ID as the Paystack reference for easy lookup later.
    try {
      const paystackResponse = await initiateSTKPush(
        user.phoneNumber,
        amount,
        transaction.id // Use our transaction ID as the payment reference
      );

      // Store the Paystack reference on the transaction
      await transaction.update({
        status: 'FIAT_PROCESSING',
        paystackReference: paystackResponse.data.reference,
      });

      console.log(`[ONRAMP] STK Push sent: ${paystackResponse.data.reference}`);
    } catch (paystackError) {
      // If Paystack fails, mark the transaction as FAILED
      await transaction.update({ status: 'FAILED' });
      console.error('[ONRAMP] Paystack STK Push failed:', paystackError);

      return res.status(502).json({
        success: false,
        error: 'Payment initiation failed. Please try again.',
        transactionId: transaction.id,
      });
    }

    // --- Return the transaction details to the frontend ---
    return res.status(201).json({
      success: true,
      message: 'On-ramp initiated. Check your phone for the M-Pesa prompt.',
      data: {
        transactionId: transaction.id,
        fiatAmount: amount,
        cryptoAmount,
        exchangeRate: EXCHANGE_RATE,
        status: transaction.status,
      },
    });
  } catch (err) {
    console.error('[ONRAMP] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while initiating on-ramp.',
    });
  }
});

export default router;
