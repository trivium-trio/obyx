const express  =require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const app=express();



app.use(cors());
app.use(express.json());
dotenv.config();

// Paystack integration
app.post('/api/checkout', async (req, res) => {
  const { email, amountInKes, walletAddress } = req.body;
  // we must manually write 'if' statements to check every single variable.
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email provided' });
  }
  
  if (!amountInKes || typeof amountInKes !== 'number') {
    return res.status(400).json({ error: 'Amount must be a number' });
  }

  if (!walletAddress || typeof walletAddress !== 'string') {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  // ... (The rest of the Paystack fetch() logic remains the same)
  try {
    // Build the strict payload
    const payload = {
      email: email,
      amount: amountInKes * 100, // Paystack requires subunits (5000 KES = 500000 cents)
      currency: 'KES',
      channels: ['mobile_money'], 
      metadata: {
        custom_fields: [
          {
            display_name: 'Wallet Address',
            variable_name: 'wallet_address',
            value: walletAddress // CRITICAL: We pass the wallet address here so it comes back in the webhook!
          }
        ]
      }
    };

    // TODO: Add Paystack API fetch() call here using `payload`

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Checkout failed' });
  }
});


app.get('/',(req,res)=>{
    res.send('Hello World');
});
app.get('/user',(req,res)=>{
    res.send('these  are  my  users');
});
app.post('/api/v1/payments/checkout',(req,res)=>{
    res.send('Checkout route');
});
const port=process.env.PORT || 5000;
app.listen(port,()=>{
    console.log(`OBYX  is  cooking on port ${port}`);
});