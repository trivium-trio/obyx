import express from 'express';
import verifyPaystackWebhook from '../middleware/verifyPaystackWebhook.js';
import config from '../config/env.js';
import { triggerMpesaSTK } from '../services/paystack.service.js';

const router = express.Router();

// ==========================================
// STEP 1.2: PAYSTACK INITIALIZATION
// ==========================================
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
        res.status(400).json({ error: error.message || 'Failed to initiate M-Pesa payment' });
    }
});

// ==========================================
// STEP 3: PAYSTACK WEBHOOK RECEIVER
// ==========================================
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