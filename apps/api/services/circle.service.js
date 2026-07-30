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

// =============================================================================
// PER-USER SCA WALLET MANAGEMENT
// Each user gets their own Smart Contract Account (SCA) wallet.
// Gas Station sponsors all transaction fees automatically for SCA wallets.
// =============================================================================

/**
 * Provision a new SCA wallet for a user within our wallet set.
 * @param {string} userId - Internal user ID (used as refId in metadata)
 * @returns {{ walletId: string, address: string }}
 */
export const createUserWallet = async (userId) => {
  console.log(`[CIRCLE] Provisioning SCA wallet for user ${userId}`);

  const response = await circleClient.createWallets({
    walletSetId: config.CIRCLE_TESTNET_WALLET_SET_ID,
    blockchains: ['BASE-SEPOLIA'],
    count: 1,
    accountType: 'SCA',
    metadata: [{ name: `obyx-user-${userId}`, refId: userId }],
  });

  const wallet = response.data.wallets[0];
  console.log(`[CIRCLE] SCA wallet created: ${wallet.id} | Address: ${wallet.address}`);

  return { walletId: wallet.id, address: wallet.address };
};

/**
 * Get the USDC balance of a user's Circle wallet.
 * @param {string} walletId - Circle wallet UUID
 * @returns {number} USDC balance as a float
 */
export const getWalletBalance = async (walletId) => {
  const response = await circleClient.getWalletTokenBalance({ id: walletId });
  const usdcBalance = response.data?.tokenBalances?.find(
    (tb) => tb.token.id === USDC_TOKEN_ID
  );
  return parseFloat(usdcBalance?.amount || '0');
};

/**
 * Transfer USDC from a user's SCA wallet to a destination address.
 * Gas is automatically sponsored by Circle Gas Station for SCA wallets.
 * @param {string} sourceWalletId - The sender's Circle SCA wallet UUID
 * @param {string} destinationAddress - On-chain destination (0x...)
 * @param {number} amount - USDC amount to send
 * @returns {{ idempotencyKey: string, circleTxId: string, chain: string }}
 */
export const transferUSDC = async (sourceWalletId, destinationAddress, amount) => {
  const idempotencyKey = crypto.randomUUID();
  console.log(`[CIRCLE] Transferring ${amount} USDC from wallet ${sourceWalletId} -> ${destinationAddress}`);

  const response = await circleClient.createTransaction({
    idempotencyKey,
    walletId: sourceWalletId,
    tokenId: USDC_TOKEN_ID,
    destinationAddress,
    amounts: [String(amount)],
    fee: {
      type: 'level',
      config: { feeLevel: 'MEDIUM' },
    },
  });

  const txId = response.data.id;
  console.log(`[CIRCLE] Transfer initiated, Circle TX ID: ${txId}`);

  return {
    idempotencyKey,
    circleTxId: txId,
    chain: 'base-sepolia',
  };
};
