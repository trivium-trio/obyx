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

// ── Types ──
interface WalletContextType {
  /** EOA address from the connected Dynamic wallet */
  walletAddress: string | null;
  /** Circle Smart Account address on Base Sepolia */
  circleAddress: string | null;
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
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isInitializingCircle, setIsInitializingCircle] = useState(false);
  const [circleError, setCircleError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bundlerClientRef = useRef<any>(null);
  const initAttemptedForRef = useRef<string | null>(null);

  const isConnected = !!primaryWallet;

  // ── Initialize Circle Smart Account & fetch profile when wallet connects ──
  useEffect(() => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      setWalletAddress(null);
      setCircleAddress(null);
      setUserPhone(null);
      setCircleError(null);
      bundlerClientRef.current = null;
      initAttemptedForRef.current = null;
      return;
    }

    const addr = primaryWallet.address;
    setWalletAddress(addr);

    // Fetch profile for existing phone number
    UserService.getUserProfile().then((profile) => {
      if (profile?.phoneNumber) {
        setUserPhone(profile.phoneNumber);
      }
    });

    if (initAttemptedForRef.current === addr) return;
    initAttemptedForRef.current = addr;

    async function initCircle() {
      setIsInitializingCircle(true);
      setCircleError(null);
      try {
        let walletClient: any;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            walletClient = await (primaryWallet!.connector as any).getWalletClient();
            if (walletClient) break;
          } catch (e: any) {
            if (attempt === 4) throw e;
            await new Promise((r) => setTimeout(r, 600));
          }
        }
        
        if (!walletClient.account) {
          walletClient.account = {
            address: addr as `0x${string}`,
            type: "json-rpc",
          };
        }
        
        const smartAccount = await initCircleSmartAccount(walletClient as any, addr);
        const bundlerClient = createCircleBundlerClient(smartAccount);

        bundlerClientRef.current = bundlerClient;
        setCircleAddress(smartAccount.address);
        
        try {
          // Link the user's direct MetaMask EOA instead of the Circle Smart Account
          const res = await UserService.postUserLinkWallet({ walletAddress: addr });
          if (res.phoneNumber) {
            setUserPhone(res.phoneNumber);
          }
          console.log("[WALLET] Linked EOA wallet to backend:", addr);
        } catch (linkErr) {
          console.warn("[WALLET] Failed to link wallet (non-fatal):", linkErr);
        }
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
