"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";

// ── Status config ──
const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  COMPLETED: { label: "Completed", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  PENDING: { label: "Pending", color: "text-neon-amber", bg: "bg-neon-amber/10", dot: "bg-neon-amber animate-pulse" },
  FIAT_PROCESSING: { label: "Processing", color: "text-neon-amber", bg: "bg-neon-amber/10", dot: "bg-neon-amber animate-pulse" },
  FIAT_RECEIVED: { label: "Fiat Received", color: "text-info", bg: "bg-info/10", dot: "bg-info" },
  CRYPTO_PROCESSING: { label: "Sending Crypto", color: "text-violet-400", bg: "bg-violet-400/10", dot: "bg-violet-400 animate-pulse" },
  FAILED: { label: "Failed", color: "text-danger", bg: "bg-danger/10", dot: "bg-danger" },
  REFUNDED: { label: "Refunded", color: "text-white/40", bg: "bg-white/[0.06]", dot: "bg-white/40" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatAmount(amount: string | number | undefined, decimals = 2): string {
  if (amount === undefined) return "0.00";
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString("en", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals > 2 ? 6 : decimals,
  });
}

export function TransactionHistoryTable() {
  const { transactions, isLoading, error, refreshTransactions } =
    useTransactionHistory();

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-900/80 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-neon-orange" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
            Your Transactions
          </span>
          {transactions.length > 0 && (
            <span className="text-[10px] font-mono rounded-full bg-white/[0.06] px-2 py-0.5 text-white/30">
              {transactions.length}
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={refreshTransactions}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          aria-label="Refresh transactions"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </motion.button>
      </div>

      {/* ── Column Headers ── */}
      <div className="hidden sm:grid grid-cols-[1fr_0.8fr_0.6fr_1fr_1fr_1fr_0.8fr] gap-2 px-5 py-2 text-[10px] font-mono text-white/20 uppercase tracking-wider border-b border-white/[0.03]">
        <span>Date</span>
        <span>Type</span>
        <span>Pair</span>
        <span className="text-right">Fiat</span>
        <span className="text-right">Crypto</span>
        <span className="text-right">Tx Hash</span>
        <span className="text-right">Status</span>
      </div>

      {/* ── Loading State ── */}
      {isLoading && transactions.length === 0 && (
        <div className="px-5 py-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_0.8fr_0.6fr_1fr_1fr_1fr_0.8fr] gap-2 py-3 border-b border-white/[0.02]"
            >
              {[...Array(7)].map((_, j) => (
                <div
                  key={j}
                  className="h-4 rounded bg-white/[0.04] animate-shimmer"
                  style={{ animationDelay: `${j * 100}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-danger/70">{error}</p>
          <button
            onClick={refreshTransactions}
            className="mt-2 text-[11px] text-white/30 hover:text-white/50 underline transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !error && transactions.length === 0 && (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <History className="h-5 w-5 text-white/15" />
          </div>
          <p className="text-sm text-white/30 font-medium mb-1">
            No transactions yet
          </p>
          <p className="text-xs text-white/15">
            Your swap history will appear here after your first trade
          </p>
        </div>
      )}

      {/* ── Transaction Rows ── */}
      {transactions.length > 0 && (
        <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <AnimatePresence initial={false}>
            {transactions.map((tx, index) => {
              const status = statusConfig[tx.status as string ?? "PENDING"] ?? statusConfig.PENDING;
              const isOnramp = tx.type === "ONRAMP";
              const pair = `${tx.fiatCurrency ?? "KES"}/${tx.cryptoCurrency ?? "USDC"}`;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-[1fr_0.8fr_0.6fr_1fr_1fr_1fr_0.8fr] gap-1 sm:gap-2 px-5 py-3 text-xs font-mono border-b border-white/[0.02]",
                    "hover:bg-white/[0.02] transition-colors group",
                  )}
                >
                  {/* Date & Time */}
                  <div className="flex sm:flex-col gap-1 sm:gap-0">
                    <span className="text-white/40">{formatDate(tx.createdAt ?? new Date().toISOString())}</span>
                    <span className="text-white/20 text-[10px]">{formatTime(tx.createdAt ?? new Date().toISOString())}</span>
                  </div>

                  {/* Type Badge */}
                  <div className="flex items-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        isOnramp
                          ? "bg-success/10 text-success"
                          : "bg-neon-orange/10 text-neon-orange",
                      )}
                    >
                      {isOnramp ? (
                        <ArrowDownLeft className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      )}
                      {isOnramp ? "Buy" : "Sell"}
                    </span>
                  </div>

                  {/* Pair */}
                  <span className="text-white/50 font-medium hidden sm:block">
                    {pair}
                  </span>

                  {/* Fiat Amount */}
                  <span className="text-right text-white/40">
                    <span className="sm:hidden text-white/20 mr-1">Paid:</span>
                    {formatAmount(tx.fiatAmount)} {tx.fiatCurrency}
                  </span>

                  {/* Crypto Amount */}
                  <span className="text-right text-white/50">
                    <span className="sm:hidden text-white/20 mr-1">Received:</span>
                    {formatAmount(tx.cryptoAmount, 6)} {tx.cryptoCurrency}
                  </span>

                  {/* Tx Hash */}
                  <div className="text-right">
                    {tx.txHash ? (
                      <a
                        href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-info/60 hover:text-info transition-colors"
                      >
                        {tx.txHash.slice(0, 6)}…{tx.txHash.slice(-4)}
                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-white/15">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                        status.bg,
                        status.color,
                      )}
                    >
                      <span className={cn("h-1 w-1 rounded-full", status.dot)} />
                      {status.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
