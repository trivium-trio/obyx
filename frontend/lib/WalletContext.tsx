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
import { createCircleSmartAccount } from "@/lib/circle";
import { UserService } from "@/lib/UserService";

interface WalletContextType {
  /** EOA address from the connected Dynamic wallet (the signer/owner) */
  eoaAddress: string | null;
  /** Circle smart account address (the actual funds-receiving address) */
  walletAddress: string | null;
  isConnected: boolean;
  isSyncing: boolean;
  disconnect: () => Promise<void>;
  linkWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  eoaAddress: null,
  walletAddress: null,
  isConnected: false,
  isSyncing: false,
  disconnect: async () => {},
  linkWallet: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const [eoaAddress, setEoaAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const isConnected = !!primaryWallet;

  useEffect(() => {
    let cancelled = false;

    async function deriveAndSync() {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        setEoaAddress(null);
        setWalletAddress(null);
        return;
      }

      setEoaAddress(primaryWallet.address);
      setIsSyncing(true);

      try {
        const walletClient = await primaryWallet.getWalletClient();
        const smartAccount = await createCircleSmartAccount(walletClient);

        if (cancelled) return;
        setWalletAddress(smartAccount.address);

        // Sync the smart account address (not the raw EOA) to the backend.
        await UserService.linkWallet(smartAccount.address);
      } catch (err) {
        console.error("[WalletContext] Failed to derive/sync smart account:", err);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }

    deriveAndSync();
    return () => {
      cancelled = true;
    };
  }, [primaryWallet]);

  const linkWallet = useCallback(async () => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

    setEoaAddress(primaryWallet.address);
    setIsSyncing(true);

    try {
      const walletClient = await primaryWallet.getWalletClient();
      const smartAccount = await createCircleSmartAccount(walletClient);

      setWalletAddress(smartAccount.address);
      await UserService.linkWallet(smartAccount.address);
    } catch (err) {
      console.error("[WalletContext] Failed to link wallet:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [primaryWallet]);

  const disconnect = useCallback(async () => {
    try {
      await handleLogOut();
    } catch {
      // Dynamic may throw if already disconnected
    }
    setEoaAddress(null);
    setWalletAddress(null);
  }, [handleLogOut]);

  return (
    <WalletContext.Provider
      value={{ eoaAddress, walletAddress, isConnected, isSyncing, disconnect, linkWallet }}
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