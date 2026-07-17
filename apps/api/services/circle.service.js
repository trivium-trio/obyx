import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import config from '../config/env.js';

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: config.CIRCLE_TESTNET_API_KEY,
  entitySecret: config.CIRCLE_TESTNET_ENTITY_SECRET,
});

import crypto from 'crypto';

const USDC_TOKEN_ID = config.CIRCLE_USDC_TOKEN_ID;

/**
 * Send USDC from Treasury to a user's wallet address.
 */
export const sendUSDC = async (walletAddress, amount, idempotencyKey = crypto.randomUUID()) => {
  console.log(`[CIRCLE] Sending ${amount} USDC -> ${walletAddress} from Treasury`);
  
  const response = await circleClient.createTransaction({
    idempotencyKey: idempotencyKey,
    walletId: config.CIRCLE_TESTNET_WALLET_ID,
    tokenId: USDC_TOKEN_ID,
    destinationAddress: walletAddress,
    amounts: [String(amount)],
    fee: {
      type: 'level',
      config: {
        feeLevel: 'MEDIUM'
      }
    }
  });

  const txId = response.data.id;
  console.log(`[CIRCLE] Transaction initiated, ID: ${txId}. Check circle webhooks for updates.`);

  return {
    success: true,
    txId: txId,
    txHash: null,
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
