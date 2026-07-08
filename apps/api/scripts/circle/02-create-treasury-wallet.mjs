import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import 'dotenv/config';

const apiKey = process.env.CIRCLE_TESTNET_API_KEY;
const entitySecret = process.env.CIRCLE_TESTNET_ENTITY_SECRET;

if (!apiKey || !entitySecret) {
  console.error("Missing CIRCLE_TESTNET_API_KEY or CIRCLE_TESTNET_ENTITY_SECRET in .env");
  process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});

try {
  console.log("Creating Wallet Set...");
  const walletSetRes = await client.createWalletSet({ name: 'Obyx Treasury' });
  const walletSetId = walletSetRes.data?.walletSet?.id;

  if (!walletSetId) {
    throw new Error("Failed to create Wallet Set");
  }

  console.log('CIRCLE_TESTNET_WALLET_SET_ID:', walletSetId);
  console.log("Creating Treasury Wallet on Base Sepolia...");

  const walletsRes = await client.createWallets({
    walletSetId,
    blockchains: ['BASE-SEPOLIA'],
    count: 1,
    accountType: 'EOA',//DCW NOT  AN EOA!!
  });

  const wallet = walletsRes.data?.wallets?.[0];
  console.log('\n======================================================');
  console.log('CIRCLE_TESTNET_WALLET_ID:', wallet?.id);
  console.log('Treasury Address:', wallet?.address);
  console.log('======================================================\n');
  console.log("Next step: Fund this Treasury Address with Testnet USDC and ETH using a faucet.");
} catch (error) {
  console.error("Error creating treasury wallet:", error.response?.data || error.message);
}
