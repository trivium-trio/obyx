// ═══════════════════════════════════════════════════
// OBYX — User Service
// Frontend service layer for user transaction CRUD
// ═══════════════════════════════════════════════════

import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// ── Types ──
export interface UserTransaction {
  id: string;
  userId: string;
  type: "ONRAMP" | "OFFRAMP";
  status:
    | "PENDING"
    | "FIAT_PROCESSING"
    | "FIAT_RECEIVED"
    | "CRYPTO_PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "REFUNDED";
  fiatAmount: string;
  fiatCurrency: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  exchangeRate: string;
  paystackReference: string | null;
  txHash: string | null;
  walletAddress: string | null;
  cryptoNetwork: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current Supabase session's access token for API auth.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export const UserService = {
  /**
   * Fetch the authenticated user's transaction history.
   * Returns up to `limit` transactions, ordered newest first.
   */
  async getUserTransactions(limit = 50): Promise<UserTransaction[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${API_BASE}/user/transactions?limit=${limit}`,
        { headers },
      );

      if (!res.ok) {
        console.error("Failed to fetch transactions:", res.statusText);
        return [];
      }

      const json = await res.json();
      return json.data ?? [];
    } catch (err) {
      console.error("UserService.getUserTransactions error:", err);
      return [];
    }
  },

  /**
   * Record a new transaction after a successful swap.
   * This calls the on-ramp checkout endpoint or directly inserts
   * into the transactions table via a dedicated endpoint.
   *
   * For now, we record locally and optimistically update the UI.
   * The actual DB insert happens via the webhook/onramp flow.
   */
  async recordTransaction(data: {
    type: "ONRAMP" | "OFFRAMP";
    fiatAmount: number;
    fiatCurrency: string;
    cryptoAmount: number;
    cryptoCurrency: string;
    exchangeRate: number;
    txHash?: string;
    walletAddress?: string;
    cryptoNetwork?: string;
  }): Promise<UserTransaction | null> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/user/transactions`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        console.error("Failed to record transaction:", res.statusText);
        return null;
      }

      const json = await res.json();
      return json.data ?? null;
    } catch (err) {
      console.error("UserService.recordTransaction error:", err);
      return null;
    }
  },

  async linkWallet(walletAddress: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/user/link-wallet`, {
        method: "POST",
        headers,
        body: JSON.stringify({ walletAddress }),
      });

      if (!res.ok) {
        console.error("Failed to link wallet:", res.statusText);
        return false;
      }

      const json = await res.json();
      return json.success ?? false;
    } catch (err) {
      console.error("UserService.linkWallet error:", err);
      return false;
    }
  },
};
