import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import config from '../config/env.js';

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: config.CIRCLE_TESTNET_API_KEY,
  entitySecret: config.CIRCLE_TESTNET_ENTITY_SECRET,
});

// Base Sepolia USDC Token ID - typically fetched via listBalances on the wallet,
// but hardcoded for convenience once discovered in a specific environment.
// For production/mainnet this changes.
const USDC_TOKEN_ID = 'FILL_FROM_BALANCE_SCRIPT';

/**
 * Send USDC from Treasury to a user's wallet address.
 */
export const sendUSDC = async (walletAddress, amount) => {
  console.log(`[CIRCLE] Sending ${amount} USDC -> ${walletAddress} from Treasury`);
  
  const response = await circleClient.createTransaction({
    walletId: config.CIRCLE_TESTNET_WALLET_ID,
    tokenId: USDC_TOKEN_ID,
    destinationAddress: walletAddress,
    amounts: [String(amount)],
    feeLevel: 'MEDIUM',
  });

  const txId = response.data.id;
  console.log(`[CIRCLE] Transaction initiated, ID: ${txId}. Polling for completion...`);

  // Poll until terminal state
  let tx;
  do {
    await new Promise(r => setTimeout(r, 3000));
    tx = (await circleClient.getTransaction({ id: txId })).data;
    console.log(`[CIRCLE] Tx ${txId} state: ${tx.state}`);
  } while (['INITIATED', 'PENDING_RISK_SCREENING', 'PENDING'].includes(tx.state));

  if (tx.state !== 'COMPLETE') {
    throw new Error(`Circle transaction failed with state: ${tx.state}`);
  }

  return {
    success: true,
    txHash: tx.txHash,
    chain: 'base-sepolia',
    amount,
    to: walletAddress,
  };
};

/**
 * Check Treasury wallet USDC balance.
 */
export const getTreasuryBalance = async () => {
  const response = await circleClient.listBalances({ walletId: config.CIRCLE_TESTNET_WALLET_ID });
  return response.data.tokenBalances;
};

/**
 * Get transaction status by Circle transaction ID.
 */
export const getTransferStatus = async (circleTransactionId) => {
  const response = await circleClient.getTransaction({ id: circleTransactionId });
  return response.data;
};
