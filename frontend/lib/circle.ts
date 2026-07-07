// creating a smart account



import { createPublicClient } from "viem";
import { baseSepolia } from "viem/chains";
import {
  toCircleSmartAccount,
  toModularTransport,
  walletClientToLocalAccount,
} from "@circle-fin/modular-wallets-core";
import type { SmartAccount } from "viem/account-abstraction";
import type { WalletClient } from "viem";

const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY as string;
const clientUrl = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL as string;

// Circle's modular wallets transport, scoped to Base Sepolia.
const modularTransport = toModularTransport(
  `${clientUrl}/baseSepolia`,
  clientKey,
);

export const circlePublicClient = createPublicClient({
  chain: baseSepolia,
  transport: modularTransport,
});

/**
 * Derive a Circle smart account owned by the given Dynamic EOA wallet client.
 * The returned account's `.address` is the smart account address — this is
 * what should be linked to the user's DB record (NOT the raw EOA address).
 */
export async function createCircleSmartAccount(
  walletClient: WalletClient,
): Promise<SmartAccount> {
  const owner = walletClientToLocalAccount(walletClient);

  return toCircleSmartAccount({
    client: circlePublicClient,
    owner,
  });
}