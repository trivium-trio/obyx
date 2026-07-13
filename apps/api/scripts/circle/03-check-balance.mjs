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

function treasuryHasGasIssue(balances) {
  if (!balances || balances.length === 0) return true;
  const nativeToken = balances.find(b => b.token?.isNative);
  if (!nativeToken) return true; // No native token balance means 0 gas
  const amount = parseFloat(nativeToken.amount);
  // Flag as issue if native gas is zero or critically low (e.g., < 0.005 ETH)
  return amount <= 0.005;
}

try {
  console.log(`Checking balances for Treasury Wallet ID: ${walletId}...`);
  const res = await client.getWalletTokenBalance({ id: walletId });
  const balances = res.data?.tokenBalances || [];

  console.log('\nTreasury Balances:');
  console.log(JSON.stringify(balances, null, 2));

} catch (error) {
  console.error("Error checking balance:", error.response?.data || error.message);
}
