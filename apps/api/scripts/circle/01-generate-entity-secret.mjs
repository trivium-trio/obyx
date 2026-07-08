import crypto from 'node:crypto';
import { registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';
import 'dotenv/config';

const apiKey = process.env.CIRCLE_TESTNET_API_KEY;

if (!apiKey) {
  console.error("Missing CIRCLE_TESTNET_API_KEY in .env");
  process.exit(1);
}

try {
  console.log("Generating Entity Secret...");
  
  // The SDK's generateEntitySecret() function prints to stdout but returns undefined.
  // We need to generate our own 32-byte hex string to actually pass to the API.
  const entitySecret = crypto.randomBytes(32).toString('hex');

  console.log('Entity Secret (save to .env as CIRCLE_TESTNET_ENTITY_SECRET):');
  console.log(entitySecret);

  console.log("Registering Entity Secret Ciphertext with Circle...");
  const response = await registerEntitySecretCiphertext({ apiKey, entitySecret });
  console.log('\nRegistration Success. Save this recovery file securely:');
  console.log(response.data?.recoveryFile);
} catch (error) {
  console.error("Error generating entity secret:", error.response?.data || error.message);
}
