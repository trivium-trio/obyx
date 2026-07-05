"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

// ── Types ──
interface WalletContextType {
  /** EOA address from the connected Dynamic wallet */
  walletAddress: string | null;
  /** Whether a wallet is connected via Dynamic */
  isConnected: boolean;
  /** Disconnect the wallet */
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  isConnected: false,
  disconnect: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const isConnected = !!primaryWallet;

  // ── Track wallet address when wallet connects/disconnects ──
  useEffect(() => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      setWalletAddress(null);
      return;
    }

    setWalletAddress(primaryWallet.address);
  }, [primaryWallet]);

  // ── Disconnect ──
  const disconnect = useCallback(async () => {
    try {
      await handleLogOut();
    } catch {
      // Dynamic may throw if already disconnected
    }
    setWalletAddress(null);
  }, [handleLogOut]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
