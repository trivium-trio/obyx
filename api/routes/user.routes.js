// USER ROUTES
import { Router } from 'express';
import { User } from '../models/index.js';
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

    // --- Update the user's wallet address ---
    const [updatedCount] = await User.update(
      { walletAddress }, // The model setter will lowercase this
      { where: { id: userId } }
    );

    if (updatedCount === 0) {
      // User exists in Supabase Auth but not yet in our DB.
      return res.status(404).json({
        success: false,
        error: 'User not found in database. Please complete onboarding first.',
      });
    }

    // Fetch the updated user to return
    const user = await User.findByPk(userId, {
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

// --- GET /transactions Endpoint ---
// Returns a mock array of transaction objects representing the user's ledger

/**
 * @openapi
 * /user/transactions:
 *   get:
 *     summary: Get user transaction ledger
 *     description: >
 *       Fetches the authenticated user's transaction ledger,
 *       returning a list of all on-ramp transactions.
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
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: tx_01h9y4a2k8m
 *                       amount:
 *                         type: number
 *                         example: 13000
 *                       status:
 *                         type: string
 *                         example: COMPLETED
 *                       date:
 *                         type: string
 *                         format: date-time
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
 *                   example: Internal server error while fetching transactions.
 */
router.get('/transactions', verifySupabaseToken, async (req, res) => {
  try {
    const mockTransactions = [
      {
        id: 'tx_01h9y4a2k8m',
        type: 'ONRAMP',
        status: 'COMPLETED',
        fiatAmount: 13000,
        fiatCurrency: 'KES',
        cryptoAmount: 100,
        cryptoCurrency: 'USDC',
        exchangeRate: 130.00,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'tx_02k8m5b3p9n',
        type: 'ONRAMP',
        status: 'PENDING',
        fiatAmount: 6500,
        fiatCurrency: 'KES',
        cryptoAmount: 50,
        cryptoCurrency: 'USDC',
        exchangeRate: 130.00,
        createdAt: new Date().toISOString(),
      },
    ];

    return res.status(200).json({
      success: true,
      data: mockTransactions,
    });
  } catch (err) {
    console.error('[USER] Error fetching transactions:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching transactions.',
    });
  }
});

export default router;
