// =============================================================================
// USER ROUTES
// Handles user profile operations (wallet linking, etc.)
// All routes are protected by Supabase JWT verification.
// =============================================================================
const express = require('express');
const router = express.Router();
const { User } = require('../models');
const verifySupabaseToken = require('../middleware/verifySupabaseToken');

// ---------------------------------------------------------------------------
// POST /api/user/link-wallet
// Called after the user connects their MetaMask wallet on the frontend.
// Updates (or sets) the walletAddress field on the user's record.
// ---------------------------------------------------------------------------
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
      // This can happen if the user signed up but the sync hasn't run.
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

module.exports = router;
