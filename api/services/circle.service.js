// =============================================================================
// CIRCLE SERVICE (MOCK)
// ----- Friend 1: Replace mock implementations with real Circle SDK calls -----
//
// This module handles all communication with Circle's APIs for minting/sending
// USDC on Base Sepolia from our Treasury wallet.
// Currently returns dummy responses so the orchestrator can be tested.
// =============================================================================

/**
 * Send USDC from our Treasury wallet to a user's EOA wallet on Base Sepolia.
 *
 * @param {string} walletAddress - Destination MetaMask EOA address (lowercase)
 * @param {number} amount        - Amount of USDC to send (e.g., 11.54)
 * @returns {Promise<object>}    - Object containing the blockchain txHash
 *
 * TODO (Friend 1):
 *   - Initialize the Circle SDK with your API key
 *   - Use the Circle Programmable Wallets or Mint API
 *   - Execute a transfer of `amount` USDC on Base Sepolia
 *   - Return the real transaction hash from the blockchain
 */
export const sendUSDC = async (walletAddress, amount) => {
  console.log(`[CIRCLE MOCK] Sending ${amount} USDC -> ${walletAddress} on Base Sepolia`);

  // Simulate blockchain confirmation delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate a fake tx hash for development
  const fakeTxHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  return {
    success: true,
    txHash: fakeTxHash,
    chain: 'base-sepolia',
    amount,
    to: walletAddress,
  };
};

/**
 * Check the status of a USDC transfer on-chain.
 *
 * @param {string} txHash - The blockchain transaction hash to check
 * @returns {Promise<object>} - Transfer status
 *
 * TODO (Friend 1):
 *   - Query the Circle API or Base Sepolia RPC for tx confirmation
 *   - Return { confirmed: true/false, blockNumber, ... }
 */
export const getTransferStatus = async (txHash) => {
  console.log(`[CIRCLE MOCK] Checking tx status: ${txHash}`);

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    confirmed: true,
    txHash,
    blockNumber: 12345678,
    chain: 'base-sepolia',
  };
};
