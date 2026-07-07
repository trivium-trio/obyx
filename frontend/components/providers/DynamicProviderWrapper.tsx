"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { WalletProvider } from "@/lib/WalletContext";
import { TransactionHistoryProvider } from "@/lib/TransactionHistoryContext";
import type { ReactNode } from "react";

const DYNAMIC_ENV_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID;

if (!DYNAMIC_ENV_ID) {
  throw new Error("Missing NEXT_PUBLIC_DYNAMIC_ENV_ID");
}

/**
 * Client-side wrapper for Dynamic + Wallet providers.
 * Dynamic handles wallet connection (MetaMask, WalletConnect, Coinbase, Phantom, etc.)
 * WalletProvider manages Circle Smart Account initialization.
 *
 * NOTE: This does NOT handle auth — Supabase AuthProvider wraps this component.
 */
export function DynamicProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
        // Wallet-only mode — no email/social auth flows
        walletConnectPreferredChains: ["eip155:84532"], // Base Sepolia chain ID
      }}
    >
      <WalletProvider>
        <TransactionHistoryProvider>{children}</TransactionHistoryProvider>
      </WalletProvider>
    </DynamicContextProvider>
  );
}
