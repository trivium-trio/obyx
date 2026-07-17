// ═══════════════════════════════════════════════════
// OBYX — User Service
// Frontend service layer for user transaction CRUD
// ═══════════════════════════════════════════════════

import { supabase } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

// ── Types ──
export interface UserTransaction {
  id: string;
  userId: string;
  type: "ONRAMP" | "OFFRAMP";
  status:
    | "INITIATED"
    | "PROMPT_SENT"
    | "PAID"
    | "PAYOUT_QUEUED"
    | "PAYOUT_SENT"
    | "FAILED"
    | "PAYOUT_FAILED";
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

  /**
   * Fetch current user profile (ID, phoneNumber, walletAddress).
   */
  async getUserProfile(): Promise<{
    id: string;
    phoneNumber: string | null;
    walletAddress: string | null;
  } | null> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/user/profile`, { headers });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    } catch (err) {
      console.error("UserService.getUserProfile error:", err);
      return null;
    }
  },

  /**
   * Save or update M-Pesa phone number.
   */
  async postUserPhone(data: { phoneNumber: string }): Promise<{
    id: string;
    phoneNumber: string;
    walletAddress: string | null;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/user/phone`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to update phone number.");
    }
    return json.data;
  },

  /**
   * Link wallet address to user account.
   */
  async postUserLinkWallet(data: { walletAddress: string }): Promise<{
    userId: string;
    walletAddress: string;
    phoneNumber?: string | null;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/user/link-wallet`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to link wallet.");
    }
    return json.data;
  },
};
