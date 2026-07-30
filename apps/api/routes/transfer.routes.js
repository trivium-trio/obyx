// WALLET-TO-WALLET TRANSFER ROUTES
// Handles gasless USDC transfers from a user's Circle SCA wallet to any destination.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User, Transaction, sequelize } from '../models/index.js';
import verifySupabaseToken from '../middleware/verifySupabaseToken.js';
import { transferUSDC, getWalletBalance } from '../services/circle.service.js';

const router = Router();

const transferLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many transfer requests. Please try again after a minute.',
  },
});

const MIN_TRANSFER_AMOUNT = 0.01;  // Minimum 0.01 USDC
const MAX_TRANSFER_AMOUNT = 10000; // Maximum 10,000 USDC

/**
 * @openapi
 * /transfer:
 *   post:
 *     summary: Transfer USDC wallet-to-wallet
 *     description: >
 *       Initiates a gasless USDC transfer from the authenticated user's
 *       Circle SCA wallet to a destination address on Base Sepolia.
 *       Gas fees are sponsored by Circle's Gas Station.
 *       The user must have a provisioned Circle SCA wallet and
 *       sufficient USDC balance.
 *     tags:
 *       - Transfer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - destinationAddress
 *               - amount
 *             properties:
 *               destinationAddress:
 *                 type: string
 *                 description: Destination wallet address (0x...)
 *                 example: '0x1234567890abcdef1234567890abcdef12345678'
 *               amount:
 *                 type: number
 *                 description: Amount of USDC to transfer
 *                 example: 10.5
 *     responses:
 *       201:
 *         description: Transfer initiated successfully
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
 *                   example: Transfer initiated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                     destinationAddress:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: TRANSFER_SENT
 *                     chain:
 *                       type: string
 *                       example: base-sepolia
 *       400:
 *         description: Bad request – invalid inputs, no wallet provisioned, or insufficient balance
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests – rate limit exceeded
 *       500:
 *         description: Internal server error
 *       502:
 *         description: Circle SDK transfer failed
 */
router.post('/', transferLimiter, verifySupabaseToken, async (req, res) => {
  try {
    const { destinationAddress, amount: rawAmount } = req.body;
    const userId = req.user.id;

    // --- Input Validation ---
    if (!destinationAddress || typeof destinationAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'destinationAddress is required.',
      });
    }

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(destinationAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum wallet address format.',
      });
    }

    if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'A valid positive amount (in USDC) is required.',
      });
    }

    const amount = parseFloat(rawAmount);

    if (amount < MIN_TRANSFER_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Minimum transfer amount is ${MIN_TRANSFER_AMOUNT} USDC.`,
      });
    }

    if (amount > MAX_TRANSFER_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Maximum transfer amount is ${MAX_TRANSFER_AMOUNT} USDC.`,
      });
    }

    // --- Fetch User & Verify SCA Wallet ---
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please complete onboarding first.',
      });
    }

    if (!user.circleWalletId) {
      return res.status(400).json({
        success: false,
        error: 'No Circle wallet provisioned. Please provision a wallet first via POST /api/v1/user/provision-wallet.',
      });
    }

    // --- On-chain Balance Check ---
    const balance = await getWalletBalance(user.circleWalletId);

    if (balance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient USDC balance. Available: ${balance} USDC, Requested: ${amount} USDC.`,
      });
    }

    // --- Execute within a Sequelize managed transaction for atomicity ---
    // If the Circle SDK call fails, the DB transaction is rolled back automatically.
    let transaction;

    try {
      transaction = await sequelize.transaction(async (dbTx) => {
        // 1. Create PENDING transaction record to lock the funds
        const txRecord = await Transaction.create({
          userId,
          type: 'TRANSFER',
          status: 'PENDING',
          cryptoAmount: amount,
          cryptoCurrency: 'USDC',
          fiatAmount: null,
          fiatCurrency: null,
          exchangeRate: null,
          walletAddress: destinationAddress,
          cryptoNetwork: 'Base Sepolia',
        }, { transaction: dbTx });

        console.log(`[TRANSFER] Transaction created: ${txRecord.id} | ${amount} USDC -> ${destinationAddress}`);

        // 2. Execute the transfer via Circle SDK (gasless via Gas Station)
        const circleResult = await transferUSDC(
          user.circleWalletId,
          destinationAddress,
          amount
        );

        // 3. Update the transaction with Circle's response
        await txRecord.update({
          status: 'TRANSFER_SENT',
          circleTxId: circleResult.circleTxId,
        }, { transaction: dbTx });

        console.log(`[TRANSFER] Circle accepted TX: ${circleResult.circleTxId} for transaction ${txRecord.id}`);

        return txRecord;
      });
    } catch (circleError) {
      console.error('[TRANSFER] Circle SDK or DB error — transaction rolled back:', circleError.message);

      return res.status(502).json({
        success: false,
        error: `Transfer failed: ${circleError.message}`,
      });
    }

    // --- Success Response ---
    return res.status(201).json({
      success: true,
      message: 'Transfer initiated successfully.',
      data: {
        transactionId: transaction.id,
        amount,
        destinationAddress,
        status: transaction.status,
        chain: 'base-sepolia',
      },
    });
  } catch (err) {
    console.error('[TRANSFER] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while initiating transfer.',
    });
  }
});

export default router;
