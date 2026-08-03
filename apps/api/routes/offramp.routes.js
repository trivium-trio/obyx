import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User, Transaction } from '../models/index.js';
import verifySupabaseToken from '../middleware/verifySupabaseToken.js';
import config from '../config/env.js';

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
const MIN_CRYPTO_AMOUNT = 1;  // Minimum 1 USDC (~130 KES)
const MAX_CRYPTO_AMOUNT = 5000; // Maximum 5000 USDC (~650,000 KES)

// POST /init

/**
 * @openapi
 * /offramp/init:
 *   post:
 *     summary: Initiate crypto-to-fiat off-ramp
 *     description: >
 *       Initiates an off-ramp transaction. Accepts a USDC amount, verifies limits,
 *       and returns the generated transaction ID along with calculated fiat value.
 *     tags:
 *       - Offramp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usdcAmount
 *             properties:
 *               usdcAmount:
 *                 type: number
 *                 description: Amount in USDC to convert
 *                 example: 50
 *     responses:
 *       201:
 *         description: Off-ramp transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       format: uuid
 *                     cryptoAmount:
 *                       type: number
 *                     fiatAmount:
 *                       type: number
 *                     exchangeRate:
 *                       type: number
 *                     status:
 *                       type: string
 *                     treasuryAddress:
 *                       type: string
 *                       description: The OBYX treasury wallet address for USDC deposits
 *       400:
 *         description: Bad request – invalid amount or missing user phone number
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Internal server error
 */
router.post('/init', initLimiter, verifySupabaseToken, async (req, res) => {
  try {
    const { usdcAmount } = req.body;
    const userId = req.user.id;

    if (!usdcAmount || isNaN(usdcAmount) || usdcAmount <= 0) {
      return res.status(400).json({ success: false, error: 'A valid positive usdcAmount is required.' });
    }

    const cryptoAmount = parseFloat(usdcAmount);

    if (cryptoAmount < MIN_CRYPTO_AMOUNT || cryptoAmount > MAX_CRYPTO_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Transaction amount must be between ${MIN_CRYPTO_AMOUNT} and ${MAX_CRYPTO_AMOUNT} USDC.`,
      });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    if (!user.phoneNumber) return res.status(400).json({ success: false, error: 'No phone number on file.' });

    const fiatAmount = parseFloat((cryptoAmount * EXCHANGE_RATE).toFixed(2));

    const transaction = await Transaction.create({
      userId,
      type: 'OFFRAMP',
      status: 'INITIATED',
      cryptoAmount,
      cryptoCurrency: 'USDC',
      fiatAmount,
      fiatCurrency: 'KES',
      exchangeRate: EXCHANGE_RATE,
    });

    console.log(`[OFFRAMP] Transaction created: ${transaction.id} | ${cryptoAmount} USDC -> ${fiatAmount} KES`);
    // Return the configured treasury wallet address to ensure the frontend deposits
    // funds into the OBYX Treasury rather than back to the user's own wallet.

    return res.status(201).json({
      success: true,
      data: {
        transactionId: transaction.id,
        cryptoAmount,
        fiatAmount,
        exchangeRate: EXCHANGE_RATE,
        status: transaction.status,
        treasuryAddress: config.TREASURY_WALLET_ADDRESS,
      },
    });
  } catch (err) {
    console.error('[OFFRAMP] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /confirm
// The frontend calls this after the user signs the transaction in MetaMask

/**
 * @openapi
 * /offramp/confirm:
 *   post:
 *     summary: Confirm off-ramp USDC transfer
 *     description: >
 *       Called by the frontend after the user signs the EVM transaction transferring
 *       USDC to the treasury. Triggers the internal fiat payout pipeline.
 *     tags:
 *       - Offramp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - txHash
 *             properties:
 *               transactionId:
 *                 type: string
 *                 format: uuid
 *               txHash:
 *                 type: string
 *                 description: The EVM transaction hash of the USDC transfer
 *                 example: "0xabcdef1234567890abcdef1234567890abcdef1234567890"
 *     responses:
 *       200:
 *         description: Transaction confirmed and payout processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Transaction already processing or invalid state
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
router.post('/confirm', verifySupabaseToken, async (req, res) => {
  try {
    const { transactionId, txHash } = req.body;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ where: { id: transactionId, userId } });
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found.' });
    if (transaction.status !== 'INITIATED') return res.status(400).json({ success: false, error: 'Transaction already processing.' });

    await transaction.update({ status: 'AWAITING_DEPOSIT', txHash: txHash });
    console.log(`[OFFRAMP] USDC transfer initiated on-chain: ${txHash}. Transaction awaiting deposit confirmation.`);

    return res.status(200).json({
      success: true,
      message: 'Transaction confirmed on-chain. Awaiting treasury deposit before payout.',
      data: { status: 'AWAITING_DEPOSIT' },
    });
  } catch (err) {
    console.error('[OFFRAMP] Confirm error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /status/:id

/**
 * @openapi
 * /offramp/status/{id}:
 *   get:
 *     summary: Get off-ramp transaction status
 *     description: >
 *       Read-only endpoint allowing the frontend to poll for
 *       transaction status updates by transaction ID.
 *     tags:
 *       - Offramp
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique transaction ID
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
router.get('/status/:id', verifySupabaseToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!transaction) return res.status(404).json({ success: false, error: 'Not found' });
    return res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

export default router;
