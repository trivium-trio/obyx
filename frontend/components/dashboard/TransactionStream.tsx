"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { mockTransactions } from "@/lib/mock-data";
import type { Transaction } from "@/lib/mock-data";

function generateRandomTx(): Transaction {
  const pairs = ["KSH/USDC", "KSH/USDT", "NGN/USDC", "USD/ETH", "EUR/USDC", "GBP/DAI", "ZAR/USDC"];
  const statuses: Transaction["status"][] = ["completed", "completed", "completed", "pending", "failed"];
  const types: Transaction["type"][] = ["buy", "sell"];
  const amounts = ["12,500", "50,000", "3,200", "100,000", "8,750", "25,000", "1,500"];

  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const amount = amounts[Math.floor(Math.random() * amounts.length)];
  const fiat = pair.split("/")[0];
  const crypto = pair.split("/")[1];
  const value = (parseFloat(amount.replace(/,/g, "")) / (129.5 + Math.random() * 5)).toFixed(2);

  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp,
    pair,
    amount: `${amount} ${fiat}`,
    value: `${value} ${crypto}`,
    status,
    type: types[Math.floor(Math.random() * types.length)],
  };
}

export function TransactionStream() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prev) => {
        const newTx = generateRandomTx();
        return [newTx, ...prev.slice(0, 14)];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
            Live Transactions
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/20">
          {transactions.length} events
        </span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-5 gap-2 px-5 py-2 text-[10px] font-mono text-white/20 uppercase tracking-wider border-b border-white/[0.03]">
        <span>Time</span>
        <span>Pair</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Value</span>
        <span className="text-right">Status</span>
      </div>

      {/* Transaction List */}
      <div
        ref={containerRef}
        className="max-h-[420px] overflow-y-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "grid grid-cols-5 gap-2 px-5 py-3 text-xs font-mono border-b border-white/[0.02]",
                "hover:bg-white/[0.02] transition-colors"
              )}
            >
              <span className="text-white/30">{tx.timestamp}</span>
              <span className="text-white/60 font-medium">{tx.pair}</span>
              <span className="text-right text-white/40">{tx.amount}</span>
              <span className="text-right text-white/50">{tx.value}</span>
              <span className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
                    tx.status === "completed" && "bg-success/10 text-success",
                    tx.status === "pending" && "bg-neon-amber/10 text-neon-amber",
                    tx.status === "failed" && "bg-danger/10 text-danger"
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      tx.status === "completed" && "bg-success",
                      tx.status === "pending" && "bg-neon-amber animate-pulse",
                      tx.status === "failed" && "bg-danger"
                    )}
                  />
                  {tx.status}
                </span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
