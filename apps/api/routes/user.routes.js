// USER ROUTES
import { Router } from 'express';
import { User, Transaction } from '../models/index.js';
import verifySupabaseToken from '../middleware/verifySupabaseToken.js';

const router = Router();
/**
 * @openapi
 * /user/link-wallet:
 *   post:
 *     summary: Link a wallet address to a user account
 *     description: Associates an Ethereum wallet address with the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: The Ethereum wallet address to link (0x...)
 *     responses:
 *       200:
 *         description: Wallet linked successfully
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
 *                   example: Wallet linked successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *       400:
 *         description: Bad Request (Missing or invalid wallet address)
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict (Wallet already linked to another account)
 *       500:
 *         description: Internal server error
 */
router.post('/link-wallet', verifySupabaseToken, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    // --- Validation ---
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required in the request body.',
      });
    }

    // Basic Ethereum address format check (0x + 40 hex chars)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum wallet address format.',
      });
    }

    // --- Check if this wallet is already linked to a different user ---
    const existingWallet = await User.findOne({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (existingWallet && existingWallet.id !== userId) {
      return res.status(409).json({
        success: false,
        error: 'This wallet address is already linked to another account.',
      });
    }

    // --- Upsert the user and update the wallet address ---
    let user = await User.findByPk(userId);
    if (!user) {
      // Auto-assign a test phone number so Paystack STK push works in dev mode
      user = await User.create({
        id: userId,
        walletAddress,
        phoneNumber: '+254719156232'
      });
    } else {
      user.walletAddress = walletAddress;
      user.phoneNumber = '+254710000000'; // Force valid test number
      await user.save();
    }

    // Fetch the updated user to return
    user = await User.findByPk(userId, {
      attributes: ['id', 'phoneNumber', 'walletAddress'],
    });

    console.log(`[USER] Wallet linked: ${user.walletAddress} -> User: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Wallet linked successfully.',
      data: {
        userId: user.id,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error('[USER] Error linking wallet:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while linking wallet.',
    });
  }
});
/**
 * @openapi
 * /user/transactions:
 *   get:
 *     summary: Get the authenticated user's transaction history
 *     description: Returns up to 50 of the user's most recent transactions, ordered newest first.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of transactions to return
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get('/transactions', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
    });

    return res.status(200).json({
      success: true,
      data: transactions,

// --- GET /transactions Endpoint ---
// Returns real transactions for the authenticated user

/**
 * @openapi
 * /user/transactions:
 *   get:
 *     summary: Get user transaction ledger
 *     description: >
 *       Fetches the authenticated user's transaction ledger,
 *       returning a list of all on-ramp and off-ramp transactions
 *       ordered by newest first.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction ledger retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       500:
 *         description: Internal server error
 */
router.get('/transactions', verifySupabaseToken, async (req, res) => {
  try {
    // Import Transaction locally if not imported at top, wait it is imported at top
    // import { Transaction } from '../models/index.js'; // already imported at top!
    const { Transaction } = await import('../models/index.js');

    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (err) {
    console.error('[USER] Error fetching transactions:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching transactions.',
    });
  }
});

/**
 * @openapi
 * /user/transactions:
 *   post:
 *     summary: Record a new transaction for the authenticated user
 *     description: Creates a new transaction record in the database.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               fiatAmount:
 *                 type: number
 *               fiatCurrency:
 *                 type: string
 *               cryptoAmount:
 *                 type: number
 *               cryptoCurrency:
 *                 type: string
 *               exchangeRate:
 *                 type: number
 *               txHash:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *               cryptoNetwork:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction recorded successfully
 *       500:
 *         description: Internal server error
 */
router.post('/transactions', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoCurrency,
      exchangeRate,
      txHash,
      walletAddress,
      cryptoNetwork,
    } = req.body;

    const transaction = await Transaction.create({
      userId,
      type,
      status: 'COMPLETED',
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoCurrency,
      exchangeRate,
      txHash,
      walletAddress,
      cryptoNetwork,
    });

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    console.error('[USER] Error recording transaction:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while recording transaction.',
    });
  }
});

export default router;
