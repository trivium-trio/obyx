"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/AuthContext";
import { UserService, type UserTransaction } from "@/lib/UserService";

// ── Types ──
interface TransactionHistoryContextType {
  /** List of user's past transactions */
  transactions: UserTransaction[];
  /** Whether transactions are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Record a new transaction (optimistic local update + API call) */
  recordTransaction: (data: {
    type: "ONRAMP" | "OFFRAMP";
    fiatAmount: number;
    fiatCurrency: string;
    cryptoAmount: number;
    cryptoCurrency: string;
    exchangeRate: number;
    txHash?: string;
    walletAddress?: string;
    cryptoNetwork?: string;
  }) => Promise<void>;
  /** Refresh the transaction list from the server */
  refreshTransactions: () => Promise<void>;
}

const TransactionHistoryContext = createContext<TransactionHistoryContextType>({
  transactions: [],
  isLoading: false,
  error: null,
  recordTransaction: async () => {},
  refreshTransactions: async () => {},
});

export function TransactionHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch transactions when user authenticates ──
  const refreshTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await UserService.getUserTransactions(50);
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // ── Record a new transaction ──
  const recordTransaction = useCallback(
    async (data: {
      type: "ONRAMP" | "OFFRAMP";
      fiatAmount: number;
      fiatCurrency: string;
      cryptoAmount: number;
      cryptoCurrency: string;
      exchangeRate: number;
      txHash?: string;
      walletAddress?: string;
      cryptoNetwork?: string;
    }) => {
      // Optimistic local update — prepend a temporary entry
      const optimisticTx: UserTransaction = {
        id: `temp_${Date.now()}`,
        userId: user?.id ?? "",
        type: data.type,
        status: "COMPLETED",
        fiatAmount: data.fiatAmount.toString(),
        fiatCurrency: data.fiatCurrency,
        cryptoAmount: data.cryptoAmount.toString(),
        cryptoCurrency: data.cryptoCurrency,
        exchangeRate: data.exchangeRate.toString(),
        paystackReference: null,
        txHash: data.txHash ?? null,
        walletAddress: data.walletAddress ?? null,
        cryptoNetwork: data.cryptoNetwork ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTransactions((prev) => [optimisticTx, ...prev]);

      // Persist to API
      try {
        await UserService.recordTransaction(data);
        // Refresh from server to get the real record
        await refreshTransactions();
      } catch (err) {
        console.error("Failed to record transaction:", err);
        // Keep optimistic entry — it'll be corrected on next refresh
      }
    },
    [user, refreshTransactions],
  );

  return (
    <TransactionHistoryContext.Provider
      value={{
        transactions,
        isLoading,
        error,
        recordTransaction,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionHistoryContext.Provider>
  );
}

export function useTransactionHistory() {
  const context = useContext(TransactionHistoryContext);
  if (!context) {
    throw new Error(
      "useTransactionHistory must be used within a TransactionHistoryProvider",
    );
  }
  return context;
}
