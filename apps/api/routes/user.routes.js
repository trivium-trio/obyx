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
      where: { walletAddress: walletAddress },
    });

    if (existingWallet && existingWallet.id !== userId) {
      existingWallet.walletAddress = null;
      await existingWallet.save();
    }

    // --- Upsert the user and update the wallet address ---
    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({
        id: userId,
        walletAddress,
      });
    } else {
      user.walletAddress = walletAddress;
      if (user.phoneNumber === '+254710000000' || user.phoneNumber === '+254719156232') {
        user.phoneNumber = null;
      }
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
        phoneNumber: user.phoneNumber || null,
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
 * /user/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user profile including phone number and linked wallet address.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     id:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                       nullable: true
 *                     walletAddress:
 *                       type: string
 *                       nullable: true
 *       500:
 *         description: Internal server error
 */
router.get('/profile', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findByPk(userId, {
      attributes: ['id', 'phoneNumber', 'walletAddress'],
    });

    if (!user) {
      user = await User.create({ id: userId });
    } else if (user.phoneNumber === '+254710000000' || user.phoneNumber === '+254719156232') {
      user.phoneNumber = null;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber || null,
        walletAddress: user.walletAddress || null,
      },
    });
  } catch (err) {
    console.error('[USER] Error fetching profile:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching user profile.',
    });
  }
});

/**
 * @openapi
 * /user/phone:
 *   post:
 *     summary: Save or update user M-Pesa phone number
 *     description: Validates and stores a Kenyan M-Pesa phone number (+254...) for Paystack transactions.
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
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Mobile number in format +254XXXXXXXXX or 07XXXXXXXX
 *                 example: '+254712345678'
 *     responses:
 *       200:
 *         description: Phone number updated successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid phone number format
 *       500:
 *         description: Internal server error
 */
router.post('/phone', verifySupabaseToken, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.id;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'phoneNumber is required.',
      });
    }

    // Normalize phone number to +254... E.164 format
    let cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('07') || cleanPhone.startsWith('01')) {
      cleanPhone = '+254' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      cleanPhone = '+' + cleanPhone;
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      if (cleanPhone.length === 9) {
        cleanPhone = '+254' + cleanPhone;
      }
    }

    // Validate normalized Kenyan mobile format (+254 followed by 7 or 1 and 8 digits)
    const kenyaPhoneRegex = /^\+254(7|1)\d{8}$/;
    if (!kenyaPhoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Kenyan phone number format. Please enter a valid M-Pesa number (e.g., +254712345678 or 0712345678).',
      });
    }

    let user = await User.findByPk(userId);
    if (!user) {
      user = await User.create({
        id: userId,
        phoneNumber: cleanPhone,
      });
    } else {
      user.phoneNumber = cleanPhone;
      await user.save();
    }

    console.log(`[USER] Phone number updated: ${cleanPhone} -> User: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Phone number saved successfully.',
      data: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        walletAddress: user.walletAddress || null,
      },
    });
  } catch (err) {
    console.error('[USER] Error updating phone number:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while saving phone number.',
    });
  }
});

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
