
// ON-RAMP ROUTES
// Handles fiat → crypto conversion flow.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User, Transaction } from '../models/index.js';
import verifySupabaseToken from '../middleware/verifySupabaseToken.js';
import { initiateSTKPush } from '../services/paystack.service.js';

const router = Router();

const initLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after a minute.',
  },
});

const EXCHANGE_RATE = 130.00; // 1 USDC = 130 KES
const MIN_FIAT_AMOUNT = 100;  // Minimum 100 KES (~$0.77)
const MAX_FIAT_AMOUNT = 500000; // Maximum 500,000 KES (~$3,846)

/**
 * @openapi
 * /onramp/init:
 *   post:
 *     summary: Initiate fiat-to-crypto on-ramp
 *     description: >
 *       Rate-limited endpoint that triggers the on-ramp pipeline.
 *       Accepts a fiat amount in KES and initiates an M-Pesa STK push
 *       via Paystack to begin the conversion to USDC.
 *     tags:
 *       - Onramp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fiatAmount
 *             properties:
 *               fiatAmount:
 *                 type: number
 *                 description: Amount in KES to convert
 *                 example: 13000
 *     responses:
 *       200:
 *         description: On-ramp pipeline initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: On-ramp initiated. Check your phone for the M-Pesa prompt.
 *       429:
 *         description: Too many requests – rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after a minute.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error while initiating on-ramp.
 */
router.post('/init', initLimiter, verifySupabaseToken, async (req, res) => {
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

// --- GET /status/:id Endpoint ---
// Read-only endpoint allowing the frontend to poll for transaction status updates.

/**
 * @openapi
 * /onramp/status/{id}:
 *   get:
 *     summary: Get transaction status
 *     description: >
 *       Read-only endpoint allowing the frontend to poll for
 *       transaction status updates by transaction ID.
 *     tags:
 *       - Onramp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique transaction ID
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The transaction ID
 *                 status:
 *                   type: string
 *                   example: pending
 *                 amount:
 *                   type: number
 *                   example: 5000
 *                 currency:
 *                   type: string
 *                   example: KES
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of transaction creation
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error while fetching transaction status.
 */
router.get('/status/:id', verifySupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    return res.status(200).json({
      id: id,
      status: 'pending',
      amount: 5000,
      currency: 'KES',
      createdAt: new Date(),
    });
  } catch (err) {
    console.error(`[ONRAMP] Error fetching status for transaction ${req.params.id}:`, err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching transaction status.',
    });
  }
});

export default router;
