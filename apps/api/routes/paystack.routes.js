import express from 'express';
import verifyPaystackWebhook from '../middleware/verifyPaystackWebhook.js';
import config from '../config/env.js';
import { triggerMpesaSTK } from '../services/paystack.service.js';

const router = express.Router();

// ==========================================
// STEP 1.2: PAYSTACK INITIALIZATION
// ==========================================

/**
 * @openapi
 * /paystack/checkout:
 *   post:
 *     summary: Initialize Paystack payment checkout
 *     description: >
 *       Creates a Paystack payment session for mobile money.
 *       Returns an authorization URL to redirect the user to complete payment.
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
 *               - walletAddress
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               amountInKes:
 *                 type: number
 *                 description: Payment amount in KES
 *                 example: 13000
 *               walletAddress:
 *                 type: string
 *                 description: EVM wallet address to receive the crypto
 *                 example: '0x1234567890abcdef1234567890abcdef12345678'
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkout_url:
 *                   type: string
 *                   format: uri
 *                 reference:
 *                   type: string
 *       400:
 *         description: Bad Request – invalid parameters
 *       500:
 *         description: Internal server error
 */
router.post('/checkout', async (req, res) => {
    try {
        const { email, amountInKes, walletAddress } = req.body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        if (!amountInKes || typeof amountInKes !== 'number' || amountInKes <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
            return res.status(400).json({ error: 'Valid EVM wallet address required' });
        }

        const payload = {
            email: email,
            amount: amountInKes * 100, 
            currency: 'KES',
            channels: ['mobile_money'], 
            metadata: {
                custom_fields: [
                    {
                        display_name: 'Wallet Address',
                        variable_name: 'wallet_address',
                        value: walletAddress 
                    }
                ]
            }
        };

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.status) {
            return res.status(400).json({ error: result.message });
        }

        res.status(200).json({
            checkout_url: result.data.authorization_url,
            reference: result.data.reference
        });

    } catch (error) {
        console.error('Checkout Initialization Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ==========================================
// STEP 2: M-PESA STK PUSH CHARGE
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
 *                 display_text:
 *                   type: string
 *                   description: User-facing prompt text
 *                 data:
 *                   type: object
 *                   description: Full Paystack charge response
 *       400:
 *         description: Bad Request – missing or invalid parameters
 *       502:
 *         description: Bad Gateway – upstream payment provider failure
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

export default router;