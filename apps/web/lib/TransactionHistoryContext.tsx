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
import { UserService, type Transaction } from "@/lib/api/client";
import { OnrampService, OfframpService } from "@/lib/api/client";

export type UserTransaction = Transaction;

// ── Types ──
interface TransactionHistoryContextType {
  /** List of user's past transactions */
  transactions: UserTransaction[];
  /** Whether transactions are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh the transaction list from the server */
  refreshTransactions: (background?: boolean) => Promise<void>;
}

const TransactionHistoryContext = createContext<TransactionHistoryContextType>({
  transactions: [],
  isLoading: false,
  error: null,
  refreshTransactions: async () => {},
});

export function TransactionHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch transactions when user authenticates ──
  const refreshTransactions = useCallback(async (background = false) => {
    if (!user) {
      setTransactions([]);
      return;
    }

    if (!background) setIsLoading(true);
    setError(null);
    try {
      const res = await UserService.getUserTransactions();
      setTransactions(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // Poll for updates if there are pending transactions
  useEffect(() => {
    const hasPending = transactions.some(
      (tx) => {
        return tx.status === "INITIATED" ||
          tx.status === "PROMPT_SENT" ||
          tx.status === "PAID" ||
          tx.status === "PAYOUT_QUEUED";
      }
    );

    if (hasPending) {
      const intervalId = setInterval(() => {
        refreshTransactions(true);
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [transactions, refreshTransactions]);

  // Removed recordTransaction since SwapWidget executes and calls refreshTransactions

  return (
    <TransactionHistoryContext.Provider
      value={{
        transactions,
        isLoading,
        error,
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
