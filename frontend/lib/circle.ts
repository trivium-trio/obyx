// ═══════════════════════════════════════════════════
// OBYX — Circle Modular Wallets SDK Helpers
// Chain: Base Sepolia (testnet)
// ═══════════════════════════════════════════════════

import {
  toModularTransport,
  toCircleSmartAccount,
  encodeTransfer,
} from "@circle-fin/modular-wallets-core";
import { createPublicClient } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { baseSepolia } from "viem/chains";
import type { Account, WalletClient } from "viem";
import { toAccount } from "viem/accounts";

// ── Environment ──
const CLIENT_KEY = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY ?? "";
const CLIENT_URL = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL ?? "";

// ── Base Sepolia USDC contract ──
// Circle testnet USDC on Base Sepolia
export const USDC_CONTRACT_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_DECIMALS = 6;

// ── Transport ──
const modularTransport = toModularTransport(
  `${CLIENT_URL}/baseSepolia`,
  CLIENT_KEY,
);

// ── Public Client ──
export const circlePublicClient = createPublicClient({
  chain: baseSepolia,
  transport: modularTransport,
});

/**
 * Convert a Dynamic WalletClient into a viem Account that can be
 * used as the `owner` for a Circle Smart Account.
 */
export function walletClientToOwner(walletClient: WalletClient): Account {
  const address = walletClient.account?.address;
  if (!address) throw new Error("Wallet client has no account");

  return toAccount({
    address,
    async signMessage({ message }) {
      return walletClient.signMessage({ account: walletClient.account!, message });
    },
    async signTransaction(transaction) {
      return walletClient.signTransaction({
        account: walletClient.account!,
        ...transaction,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
    async signTypedData(typedData) {
      return walletClient.signTypedData({
        account: walletClient.account!,
        ...typedData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
  });
}

/**
 * Initialize a Circle Smart Account from a connected wallet client.
 */
export async function initCircleSmartAccount(walletClient: WalletClient) {
  const owner = walletClientToOwner(walletClient);

  const smartAccount = await toCircleSmartAccount({
    client: circlePublicClient,
    owner,
  });

  return smartAccount;
}

/**
 * Create a bundler client for sending user operations.
 */
export function createCircleBundlerClient(
  smartAccount: Awaited<ReturnType<typeof toCircleSmartAccount>>,
) {
  return createBundlerClient({
    account: smartAccount,
    chain: baseSepolia,
    transport: modularTransport,
  });
}

/**
 * Send a gasless USDC transfer using Circle's paymaster.
 */
export async function sendGaslessTransfer({
  bundlerClient,
  to,
  amount,
}: {
  bundlerClient: ReturnType<typeof createBundlerClient>;
  to: `0x${string}`;
  amount: bigint;
}) {
  // Send the user operation with paymaster sponsorship
  const userOpHash = await bundlerClient.sendUserOperation({
    calls: [encodeTransfer(to, USDC_CONTRACT_ADDRESS, amount)],
    paymaster: true,
  });

  // Wait for the transaction to be mined
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return { userOpHash, receipt };
}
