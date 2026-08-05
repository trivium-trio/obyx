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
import { UserService } from "@/lib/UserService";
import type { WalletClient } from "viem";

// ── Types ──
type ActiveWalletType = 'embedded' | 'external';

interface WalletContextType {
  /** EOA address from the connected Dynamic wallet */
  walletAddress: string | null;
  /** Circle Smart Account address on Base Sepolia */
  circleAddress: string | null;
  /** The currently active wallet address (Circle SA or EOA) */
  activeWalletAddress: string | null;
  /** Which wallet type is currently active */
  activeWallet: ActiveWalletType;
  /** Switch between embedded (Circle SA) and external (EOA) wallet */
  setActiveWallet: (type: ActiveWalletType) => void;
  /** Provision Circle Smart Account for the active EOA */
  provisionObyxWallet: () => Promise<void>;
  /** User M-Pesa phone number on file */
  userPhone: string | null;
  /** Set user phone number locally */
  setUserPhone: (phone: string | null) => void;
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

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [circleAddress, setCircleAddress] = useState<string | null>(null);
  
  const [activeWallet, setActiveWallet] = useState<ActiveWalletType>('external');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('obyx_active_wallet') as ActiveWalletType;
      if (stored === 'embedded' || stored === 'external') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveWallet(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('obyx_active_wallet', activeWallet);
    }
  }, [activeWallet]);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isInitializingCircle, setIsInitializingCircle] = useState(false);
  const [circleError, setCircleError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundlerClientRef = useRef<any>(null);
  const initAttemptedForRef = useRef<string | null>(null);

  const isConnected = !!primaryWallet;

  // Compute the active wallet address based on user selection
  const activeWalletAddress = activeWallet === 'embedded' ? circleAddress : walletAddress;

  // ── Explicit Circle Smart Account Provisioning ──
  const provisionObyxWallet = useCallback(async () => {
    if (!primaryWallet || !walletAddress) return;
    setIsInitializingCircle(true);
    setCircleError(null);
    try {
      let walletClient: WalletClient | undefined;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          walletClient = await (primaryWallet.connector as any).getWalletClient();
          if (walletClient) break;
        } catch (e: unknown) {
          if (attempt === 4) throw e;
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (!walletClient!.account) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (walletClient as any).account = {
          address: walletAddress as `0x${string}`,
          type: "json-rpc",
        };
      }

      const smartAccount = await initCircleSmartAccount(walletClient!, walletAddress);
      const bundlerClient = createCircleBundlerClient(smartAccount);

      bundlerClientRef.current = bundlerClient;
      setCircleAddress(smartAccount.address);
      setActiveWallet("embedded");

      try {
        const res = await UserService.postUserLinkWallet({ walletAddress: smartAccount.address });
        setUserPhone(res.phoneNumber ?? null);
        console.log("[WALLET] Linked embedded wallet to backend:", smartAccount.address);
      } catch (linkErr) {
        console.warn("[WALLET] Failed to link embedded wallet (non-fatal):", linkErr);
      }
    } catch (err: unknown) {
      console.error("Circle Smart Account explicit init failed:", err);
      setCircleError(err instanceof Error ? err.message : "Failed to initialize OBYX Wallet");
    } finally {
      setIsInitializingCircle(false);
    }
  }, [primaryWallet, walletAddress]);

  // ── Initialize Circle Smart Account & fetch profile when wallet connects ──
  useEffect(() => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWalletAddress(null);
      setCircleAddress(null);
      setUserPhone(null);
      setCircleError(null);
      bundlerClientRef.current = null;
      initAttemptedForRef.current = null;
      return;
    }

    const addr = primaryWallet.address;
    
    // If the primary EOA changed, ensure the UI switches to it
    setWalletAddress((prev) => {
      if (prev !== addr) {
        setActiveWallet('external');
      }
      return addr;
    });

    // Fetch profile for existing phone number
    UserService.getUserProfile().then((profile) => {
      if (profile?.phoneNumber) {
        setUserPhone(profile.phoneNumber);
      }
    });
  }, [primaryWallet]);

  // ── Auto-provision SCA after connection ──
  useEffect(() => {
    // If we have a connected wallet but no Circle SA, automatically provision it
    if (primaryWallet && walletAddress && !circleAddress && !isInitializingCircle) {
      // Prevent infinite loops by tracking initialization attempts per wallet address
      if (initAttemptedForRef.current !== walletAddress) {
        initAttemptedForRef.current = walletAddress;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        provisionObyxWallet();
      }
    }
  }, [primaryWallet, walletAddress, circleAddress, isInitializingCircle, provisionObyxWallet]);

  // ── Send gasless USDC transfer ──
  const sendGaslessSwap = useCallback(
    async (to: string, usdcAmount: number) => {
      if (!bundlerClientRef.current) {
        throw new Error("Circle Smart Account not initialized");
      }

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
    setUserPhone(null);
    setCircleError(null);
    bundlerClientRef.current = null;
    initAttemptedForRef.current = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('obyx_active_wallet');
    }
    // Clear Dynamic Labs cached wallet state from localStorage
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('dynamic_') ||
          key.includes('walletconnect') ||
          key.includes('wagmi') ||
          key.includes('dynamic')
        ) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [handleLogOut]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        circleAddress,
        activeWalletAddress,
        activeWallet,
        setActiveWallet,
        provisionObyxWallet,
        userPhone,
        setUserPhone,
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
