import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import 'dotenv/config';

const apiKey = process.env.CIRCLE_TESTNET_API_KEY;
const entitySecret = process.env.CIRCLE_TESTNET_ENTITY_SECRET;
const walletId = process.env.CIRCLE_TESTNET_WALLET_ID;

if (!apiKey || !entitySecret || !walletId) {
  console.error("Missing required CIRCLE_TESTNET env vars");
  process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});

try {
  console.log(`Checking balances for Treasury Wallet ID: ${walletId}...`);
  const res = await client.listBalances({ walletId });
  console.log('\nTreasury Balances:');
  console.log(JSON.stringify(res.data?.tokenBalances, null, 2));
} catch (error) {
  console.error("Error checking balance:", error.response?.data || error.message);
}
