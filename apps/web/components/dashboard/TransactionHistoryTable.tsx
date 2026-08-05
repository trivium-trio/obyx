"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  History,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";

// ── Status config ──
const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  INITIATED: { label: "Initiated", color: "text-white/50", bg: "bg-white/[0.06]", dot: "bg-white/40" },
  PROMPT_SENT: { label: "Awaiting Payment", color: "text-neon-amber", bg: "bg-neon-amber/10", dot: "bg-neon-amber animate-pulse" },
  PAID: { label: "Paid", color: "text-info", bg: "bg-info/10", dot: "bg-info" },
  PAYOUT_QUEUED: { label: "Sending Crypto", color: "text-violet-400", bg: "bg-violet-400/10", dot: "bg-violet-400 animate-pulse" },
  PAYOUT_SENT: { label: "Completed", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  FAILED: { label: "Failed", color: "text-danger", bg: "bg-danger/10", dot: "bg-danger" },
  PAYOUT_FAILED: { label: "Payout Failed", color: "text-danger", bg: "bg-danger/10", dot: "bg-danger animate-pulse" },
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

  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(20);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((tx) => {
        const hash = tx.txHash?.toLowerCase() ?? "";
        const id = tx.id?.toLowerCase() ?? "";
        const fiat = tx.fiatCurrency?.toLowerCase() ?? "";
        const crypto = tx.cryptoCurrency?.toLowerCase() ?? "";
        const status = tx.status?.toLowerCase() ?? "";
        const type = tx.type?.toLowerCase() ?? "";
        return (
          hash.includes(q) ||
          id.includes(q) ||
          fiat.includes(q) ||
          crypto.includes(q) ||
          status.includes(q) ||
          type.includes(q)
        );
      });
    }
    return list.slice(0, displayCount);
  }, [transactions, searchQuery, displayCount]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-900/80 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex-1 max-w-[320px] relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tx hash, receipt, token..." 
              aria-label="Search transactions by hash, receipt, or token"
              className="w-full bg-[#13121C] border border-white/[0.05] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.1] transition-colors"
            />
          </div>
          <button
            disabled
            title="Advanced filtering coming soon"
            aria-label="Filter transactions (coming soon)"
            className="flex items-center gap-2 bg-[#13121C] border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white/30 opacity-60 cursor-not-allowed"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/40">
          <button
            onClick={() => refreshTransactions()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#615CE8] hover:bg-[#524DCC] text-white transition-colors disabled:opacity-50"
            aria-label="Refresh transactions"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
          
          <div className="flex items-center gap-2">
            <span>Show</span>
            <div className="relative">
              <select
                value={displayCount}
                onChange={(e) => setDisplayCount(Number(e.target.value))}
                aria-label="Number of transactions to display"
                className="appearance-none bg-[#13121C] border border-white/[0.05] rounded-lg pl-3 pr-8 py-1.5 outline-none text-white/70"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
                <svg className="fill-current h-3 w-3" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
          
          <span>{transactions.length > 0 ? `1-${filteredTransactions.length} of ${transactions.length} txs` : "0 of 0 txs"}</span>
        </div>
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
            onClick={() => refreshTransactions()}
            className="mt-2 text-[11px] text-white/30 hover:text-white/50 underline transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !error && filteredTransactions.length === 0 && (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <History className="h-5 w-5 text-white/15" />
          </div>
          <p className="text-sm text-white/30 font-medium mb-1">
            {transactions.length === 0 ? "No transactions yet" : "No matching transactions found"}
          </p>
          <p className="text-xs text-white/15">
            {transactions.length === 0
              ? "Your swap history will appear here after your first trade"
              : "Try adjusting your search query"}
          </p>
        </div>
      )}

      {/* ── Transaction Rows ── */}
      {filteredTransactions.length > 0 && (
        <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <AnimatePresence initial={false}>
            {filteredTransactions.map((tx, index) => {
              const status = statusConfig[tx.status as string ?? "INITIATED"] ?? statusConfig.INITIATED;
              const isOnramp = tx.type === "ONRAMP";
              const pair = `${tx.fiatCurrency ?? "KES"}/${tx.cryptoCurrency ?? "USDC"}`;

              const dateStr = formatDate(tx.createdAt ?? new Date().toISOString());
              const timeStr = formatTime(tx.createdAt ?? new Date().toISOString());

              const typeBadge = (
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
              );

              const statusBadge = (
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
              );

              const txHashLink = tx.txHash ? (
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
              );

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={cn(
                    "px-5 py-3 text-xs font-mono border-b border-white/[0.02]",
                    "hover:bg-white/[0.02] transition-colors group",
                  )}
                >
                  {/* ── Mobile card layout ── */}
                  <div className="flex sm:hidden flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white/40">{dateStr}</span>
                        <span className="text-white/20 text-[10px]">{timeStr}</span>
                      </div>
                      {typeBadge}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 font-medium">{pair}</span>
                      {statusBadge}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col text-white/40">
                        <span className="text-white/20 text-[10px]">Paid</span>
                        <span>{formatAmount(tx.fiatAmount)} {tx.fiatCurrency}</span>
                      </div>
                      <div className="flex flex-col text-right text-white/50">
                        <span className="text-white/20 text-[10px]">Received</span>
                        <span>{formatAmount(tx.cryptoAmount, 6)} {tx.cryptoCurrency}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/20 text-[10px]">Tx Hash</span>
                      {txHashLink}
                    </div>
                  </div>

                  {/* ── Desktop grid layout ── */}
                  <div className="hidden sm:grid grid-cols-[1fr_0.8fr_0.6fr_1fr_1fr_1fr_0.8fr] gap-2 items-center">
                    {/* Date & Time */}
                    <div className="flex flex-col">
                      <span className="text-white/40">{dateStr}</span>
                      <span className="text-white/20 text-[10px]">{timeStr}</span>
                    </div>

                    {/* Type Badge */}
                    <div className="flex items-center">{typeBadge}</div>

                    {/* Pair */}
                    <span className="text-white/50 font-medium">{pair}</span>

                    {/* Fiat Amount */}
                    <span className="text-right text-white/40">
                      {formatAmount(tx.fiatAmount)} {tx.fiatCurrency}
                    </span>

                    {/* Crypto Amount */}
                    <span className="text-right text-white/50">
                      {formatAmount(tx.cryptoAmount, 6)} {tx.cryptoCurrency}
                    </span>

                    {/* Tx Hash */}
                    <div className="text-right">{txHashLink}</div>

                    {/* Status */}
                    <div className="text-right">{statusBadge}</div>
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
