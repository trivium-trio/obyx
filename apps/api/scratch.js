import crypto from 'crypto';
const secretKey = 'sk_test_1eaa3b73eb4348d58f3025fcdf1b929e2fa34437';

async function test(phone) {
  const ref = crypto.randomUUID();
  console.log('Testing with ref:', ref, 'phone:', phone);
  try {
    const response = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@obyx.co',
        amount: 10000,
        currency: 'KES',
        reference: ref,
        mobile_money: {
          phone: phone,
          provider: 'mpesa',
        }
      }),
    });
    const result = await response.json();
    console.log(`Phone: ${phone}`, response.status, result);
  } catch (e) {
    console.error('Error for', phone, e.message);
  }
}

async function run() {
  await test('0700000000');
  await test('+254700000000');
}
run();
