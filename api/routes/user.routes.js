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

export default router;
