import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';

// 🚨 Initialize dotenv BEFORE using process.env
dotenv.config();

const app = express();

// Middleware
app.use(cors());

// 🚨 CRITICAL FIX: Only ONE express.json() call, and it must include the rawBody verify function
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf; // Attach the raw binary buffer to the request object
  }
}));

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_key_here';

// ==========================================
// ROUTES
// ==========================================

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/user', (req, res) => {
    res.send('these are my users');
});

app.post('/api/v1/payments/checkout', (req, res) => {
    res.send('Checkout route');
});

// STEP 1.2: PAYSTACK INITIALIZATION
app.post('/api/checkout', async (req, res) => {
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
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
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

// STEP 3: PAYSTACK WEBHOOK RECEIVER
app.post('/api/paystack/webhook', (req, res) => {
  try {
    const rawBody = req.rawBody; 
    const signature = req.headers['x-paystack-signature'];

    const expectedSignature = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    const isAuthentic = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature || '', 'hex') 
    );

    if (!isAuthentic) {
      console.error('ALERT: Invalid Webhook Signature Detected!');
      return res.status(401).json({ error: 'Unauthorized payload' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const amountPaidInKes = event.data.amount / 100; 
      const transactionRef = event.data.reference;
      
      const walletAddress = event.data.metadata?.custom_fields?.find(
        field => field.variable_name === 'wallet_address'
      )?.value;

      console.log(`✅ M-Pesa Payment Confirmed!`);
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

// ==========================================
// SERVER INITIALIZATION
// ==========================================
// CRITICAL FIX: Only ONE app.listen() at the very bottom of the file
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`BYX is cooking on port ${PORT}`);
});