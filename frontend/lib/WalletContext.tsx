"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import {
  initCircleSmartAccount,
  createCircleBundlerClient,
  sendGaslessTransfer,
  USDC_DECIMALS,
} from "@/lib/circle";

// ── Types ──
interface WalletContextType {
  /** EOA address from the connected Dynamic wallet */
  walletAddress: string | null;
  /** Circle Smart Account address on Base Sepolia */
  circleAddress: string | null;
  /** Whether a wallet is connected via Dynamic */
  isConnected: boolean;
  /** Whether the Circle Smart Account is initializing */
  isInitializingCircle: boolean;
  /** Error string if Circle SA init failed */
  circleError: string | null;
  /** Send a gasless USDC transfer via Circle's paymaster */
  sendGaslessSwap: (to: string, usdcAmount: number) => Promise<{
    userOpHash: string;
    txHash: string;
  }>;
  /** Disconnect the wallet */
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  walletAddress: null,
  circleAddress: null,
  isConnected: false,
  isInitializingCircle: false,
  circleError: null,
  sendGaslessSwap: async () => ({ userOpHash: "", txHash: "" }),
  disconnect: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [circleAddress, setCircleAddress] = useState<string | null>(null);
  const [isInitializingCircle, setIsInitializingCircle] = useState(false);
  const [circleError, setCircleError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundlerClientRef = useRef<any>(null);
  const initAttemptedForRef = useRef<string | null>(null);

  const isConnected = !!primaryWallet;

  // ── Initialize Circle Smart Account when wallet connects ──
  useEffect(() => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      // Reset state when wallet disconnects
      setWalletAddress(null);
      setCircleAddress(null);
      setCircleError(null);
      bundlerClientRef.current = null;
      initAttemptedForRef.current = null;
      return;
    }

    const addr = primaryWallet.address;
    setWalletAddress(addr);

    // Don't re-init if we already initialized for this address
    if (initAttemptedForRef.current === addr) return;
    initAttemptedForRef.current = addr;

    async function initCircle() {
      setIsInitializingCircle(true);
      setCircleError(null);
      try {
        const walletClient = await (primaryWallet!.connector as any).getWalletClient();
        const smartAccount = await initCircleSmartAccount(walletClient as any);
        const bundlerClient = createCircleBundlerClient(smartAccount);

        bundlerClientRef.current = bundlerClient;
        setCircleAddress(smartAccount.address);
      } catch (err) {
        console.error("Circle Smart Account init failed:", err);
        setCircleError(
          err instanceof Error ? err.message : "Failed to initialize Circle Smart Account"
        );
      } finally {
        setIsInitializingCircle(false);
      }
    }

    initCircle();
  }, [primaryWallet]);

  // ── Send gasless USDC transfer ──
  const sendGaslessSwap = useCallback(
    async (to: string, usdcAmount: number) => {
      if (!bundlerClientRef.current) {
        throw new Error("Circle Smart Account not initialized");
      }

      // Convert human-readable amount to base units (6 decimals for USDC)
      const amount = BigInt(Math.round(usdcAmount * 10 ** USDC_DECIMALS));

      const { userOpHash, receipt } = await sendGaslessTransfer({
        bundlerClient: bundlerClientRef.current,
        to: to as `0x${string}`,
        amount,
      });

      return {
        userOpHash: typeof userOpHash === "string" ? userOpHash : String(userOpHash),
        txHash: receipt.receipt.transactionHash,
      };
    },
    [],
  );

  // ── Disconnect ──
  const disconnect = useCallback(async () => {
    try {
      await handleLogOut();
    } catch {
      // Dynamic may throw if already disconnected
    }
    setWalletAddress(null);
    setCircleAddress(null);
    setCircleError(null);
    bundlerClientRef.current = null;
    initAttemptedForRef.current = null;
  }, [handleLogOut]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        circleAddress,
        isConnected,
        isInitializingCircle,
        circleError,
        sendGaslessSwap,
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
