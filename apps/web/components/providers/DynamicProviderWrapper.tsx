"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { WalletProvider } from "@/lib/WalletContext";
import { TransactionHistoryProvider } from "@/lib/TransactionHistoryContext";
import type { ReactNode } from "react";

const DYNAMIC_ENV_ID = (process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID || "placeholder-env-id") as string;

const queryClient = new QueryClient();

/**
 * Client-side wrapper for Dynamic + Wallet + Wagmi providers.
 * Dynamic handles wallet connection (MetaMask, WalletConnect, Coinbase, Phantom, etc.)
 * Wagmi provides read-only RPC hooks (e.g., useBalance) to bypass Dynamic's token indexing API.
 * WalletProvider manages Circle Smart Account initialization.
 *
 * NOTE: This does NOT handle auth — Supabase AuthProvider wraps this component.
 */
export function DynamicProviderWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENV_ID,
        walletConnectors: [EthereumWalletConnectors],
        // Wallet-only mode — no email/social auth flows
        walletConnectPreferredChains: ["eip155:84532"], // Base Sepolia chain ID
        initialAuthenticationMode: "connect-only",
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <TransactionHistoryProvider>{children}</TransactionHistoryProvider>
          </WalletProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
