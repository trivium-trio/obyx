import express from 'express';
import verifyPaystackWebhook from '../middleware/verifyPaystackWebhook.js';
import config from '../config/env.js';
import { triggerMpesaSTK } from '../services/paystack.service.js';

const router = express.Router();


// ==========================================
// STEP 1: M-PESA STK PUSH CHARGE
// ==========================================

/**
 * @openapi
 * /paystack/charge-mpesa:
 *   post:
 *     summary: Initiate M-Pesa STK Push payment
 *     description: >
 *       Triggers an M-Pesa STK (Sim Toolkit) push to the user's phone
 *       via Paystack. The user receives a payment prompt on their device
 *       to authorize the transaction.
 *     tags:
 *       - Paystack
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - amountInKes
 *               - phoneNumber
 *               - walletAddress
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               amountInKes:
 *                 type: number
 *                 description: Payment amount in KES
 *                 example: 13000
 *               phoneNumber:
 *                 type: string
 *                 description: M-Pesa registered phone number
 *                 example: '+254712345678'
 *               walletAddress:
 *                 type: string
 *                 description: EVM wallet address to receive the crypto
 *                 example: '0x1234567890abcdef1234567890abcdef12345678'
 *     responses:
 *       200:
 *         description: STK Push initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reference:
 *                   type: string
 *                   description: Paystack transaction reference
 *                   example: abc123xyz
 *                 display_text:
 *                   type: string
 *                   description: User-facing prompt text
 *                   example: Please check your phone to complete payment
 *                 data:
 *                   type: object
 *                   description: Full Paystack charge response
 *       400:
 *         description: Bad Request – missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Valid email is required
 *       502:
 *         description: Bad Gateway – upstream payment provider failure
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
 *                   example: Failed to initiate M-Pesa payment
 */
router.post('/charge-mpesa', async (req, res) => {
    try {
        const { email, amountInKes, phoneNumber, walletAddress } = req.body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        const amount = Number(amountInKes);
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return res.status(400).json({ error: 'Valid phone number is required' });
        }

        if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
            return res.status(400).json({ error: 'Valid EVM wallet address required' });
        }

        const data = await triggerMpesaSTK(email, amount, phoneNumber, walletAddress);

        res.status(200).json({
            success: true,
            reference: data.reference,
            display_text: data.display_text,
            data: data
        });

    } catch (error) {
        console.error('M-Pesa Charge Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to initiate M-Pesa payment';
        res.status(502).json({ success: false, error: message });
    }
});

// ==========================================
// STEP 2: PAYSTACK WEBHOOK RECEIVER
// ==========================================

/**
 * @openapi
 * /paystack/webhook:
 *   post:
 *     summary: Paystack webhook receiver
 *     description: >
 *       Receives cryptographically signed webhook updates from Paystack.
 *       The request body is verified via HMAC-SHA512 signature in the
 *       x-paystack-signature header before processing.
 *     tags:
 *       - Paystack
 *     responses:
 *       200:
 *         description: Webhook received and processed successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Webhook Received
 *       401:
 *         description: Unauthorized – invalid HMAC signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid webhook signature
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Internal Server Error
 */
router.post('/webhook', verifyPaystackWebhook, (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const amountPaidInKes = event.data.amount / 100; 
      const transactionRef = event.data.reference;
      
      const walletAddress = event.data.metadata?.custom_fields?.find(
        field => field.variable_name === 'wallet_address'
      )?.value;

      console.log(`M-Pesa Payment Confirmed!`);
      console.log(`Amount: ${amountPaidInKes} KES`);
      console.log(`Target Wallet: ${walletAddress}`);
      console.log(`Ref: ${transactionRef}`);
    }

    res.status(200).send('Webhook Received');

  } catch (error) {
    console.error('Webhook Processing Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;