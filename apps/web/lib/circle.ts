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
import type { Account, WalletClient, Transport, PublicClient } from "viem";
import { toAccount } from "viem/accounts";

// ── Environment ──
const CLIENT_KEY = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || "placeholder-client-key";
let CLIENT_URL = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL || "https://modular-sdk.circle.com/v1/w3s";

if (!CLIENT_URL.startsWith("http://") && !CLIENT_URL.startsWith("https://")) {
  CLIENT_URL = `https://${CLIENT_URL}`;
}
try {
  new URL(CLIENT_URL);
} catch {
  CLIENT_URL = "https://modular-sdk.circle.com/v1/w3s";
}

// ── Base Sepolia USDC contract ──
// Circle testnet USDC on Base Sepolia
export const USDC_CONTRACT_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_DECIMALS = 6;

let modularTransport: ReturnType<typeof toModularTransport>;
try {
  let url = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL || "";
  if (!url || url.includes("[SENSITIVE]") || url.includes("***")) {
    url = "https://modular-sdk.circle.com/v1/w3s";
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  new URL(url);
  modularTransport = toModularTransport(`${url}/baseSepolia`, CLIENT_KEY);
} catch {
  modularTransport = toModularTransport("https://modular-sdk.circle.com/v1/w3s/baseSepolia", "placeholder-key");
}

// ── Public Client ──
export const circlePublicClient = createPublicClient({
  chain: baseSepolia,
  transport: modularTransport as Transport,
});

/**
 * Convert a Dynamic WalletClient into a viem Account that can be
 * used as the `owner` for a Circle Smart Account.
 *
 * @param walletClient - The viem WalletClient from Dynamic SDK
 * @param fallbackAddress - Optional fallback if walletClient.account is not set
 */
export function walletClientToOwner(walletClient: WalletClient, fallbackAddress?: string): Account {
  const address = walletClient.account?.address ?? (fallbackAddress as `0x${string}` | undefined);
  if (!address) throw new Error("Wallet client has no account and no fallback address was provided");

  // Ensure the walletClient has the account set for signing methods
  const account = walletClient.account ?? { address, type: "json-rpc" as const };

  return toAccount({
    address,
    async signMessage({ message }) {
      return walletClient.signMessage({ account: account as Account, message });
    },
    async signTransaction(transaction) {
      return walletClient.signTransaction({
        account: account as Account,
        ...transaction,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
    async signTypedData(typedData) {
      return walletClient.signTypedData({
        account: account as Account,
        ...typedData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
  });
}

/**
 * Initialize a Circle Smart Account from a connected wallet client.
 */
export async function initCircleSmartAccount(walletClient: WalletClient, fallbackAddress?: string) {
  const owner = walletClientToOwner(walletClient, fallbackAddress);

  const smartAccount = await toCircleSmartAccount({
    client: circlePublicClient as PublicClient,
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
    transport: modularTransport as Transport,
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
