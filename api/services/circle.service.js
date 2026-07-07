// =============================================================================
// CIRCLE SERVICE
// Handles all communication with Circle's Developer-Controlled Wallets API
// for sending USDC from our Treasury wallet to a user's smart account address
// on Base Sepolia.
// =============================================================================

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import config from '../config/env.js';

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: config.CIRCLE_API_KEY,
  entitySecret: config.CIRCLE_ENTITY_SECRET,
});

/**
 * Send USDC from our Treasury wallet to a user's smart account address on Base Sepolia.
 *
 * IMPORTANT: Circle's createTransaction call is asynchronous on Circle's side.
 * The response returned here only confirms Circle *accepted* the transfer request
 * (state: 'INITIATED') — it does NOT include a blockchain txHash yet. The txHash
 * only becomes available once the transaction confirms on-chain, which must be
 * checked later via getTransferStatus(circleTransactionId).
 *
 * @param {string} walletAddress   - Destination smart account address (lowercase)
 * @param {number} amount          - Amount of USDC to send (e.g., 11.54)
 * @param {string} idempotencyKey  - A UUID v4, unique per logical transfer attempt.
 *                                   Reuse the same key across retries of the same
 *                                   transaction so Circle won't double-send.
 * @returns {Promise<object>} - { success, circleTransactionId, state }
 */
export const sendUSDC = async (walletAddress, amount, idempotencyKey) => {
  console.log(`[CIRCLE] Sending ${amount} USDC -> ${walletAddress} on Base Sepolia (idempotencyKey: ${idempotencyKey})`);

  const response = await circleClient.createTransaction({
    idempotencyKey,
    walletId: config.CIRCLE_TREASURY_WALLET_ID,
    tokenId: config.CIRCLE_USDC_TOKEN_ID,
    destinationAddress: walletAddress,
    amounts: [amount.toString()],
    fee: {
      type: 'level',
      config: { feeLevel: 'MEDIUM' },
    },
  });

  const tx = response.data;

  return {
    success: true,
    circleTransactionId: tx.id,
    state: tx.state, // e.g. 'INITIATED'
  };
};

/**
 * Check the status of a previously-sent USDC transfer.
 * Poll this after sendUSDC() until state is 'CONFIRMED' (or 'FAILED')
 * to obtain the real on-chain txHash.
 *
 * @param {string} circleTransactionId - The Circle transaction ID from sendUSDC()
 * @returns {Promise<object>} - Circle's transaction record, including txHash once confirmed
 */
export const getTransferStatus = async (circleTransactionId) => {
  const response = await circleClient.getTransaction({ id: circleTransactionId });
  return response.data.transaction;
};