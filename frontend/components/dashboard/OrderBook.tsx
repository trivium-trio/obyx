"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { mockBids, mockAsks } from "@/lib/mock-data";
import type { OrderBookEntry } from "@/lib/mock-data";

function randomize(entries: OrderBookEntry[], variance: number = 0.02): OrderBookEntry[] {
  return entries.map((e) => ({
    ...e,
    price: +(e.price * (1 + (Math.random() - 0.5) * variance)).toFixed(2),
    amount: +(e.amount * (1 + (Math.random() - 0.5) * variance * 5)).toFixed(2),
    total: +(e.total * (1 + (Math.random() - 0.5) * variance * 5)).toFixed(2),
  }));
}

export function OrderBook() {
  const [bids, setBids] = useState(mockBids);
  const [asks, setAsks] = useState(mockAsks);

  useEffect(() => {
    const interval = setInterval(() => {
      setBids(randomize(mockBids));
      setAsks(randomize(mockAsks));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const maxTotal = Math.max(
    ...bids.map((b) => b.total),
    ...asks.map((a) => a.total)
  );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
          Order Book
        </span>
        <span className="text-[10px] font-mono text-white/20">KSH / USDC</span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 px-5 py-2 text-[10px] font-mono text-white/20 uppercase tracking-wider border-b border-white/[0.03]">
        <span>Price (KSH)</span>
        <span className="text-right">Amount (USDC)</span>
        <span className="text-right">Total (KSH)</span>
      </div>

      {/* Asks (sells) - reversed so lowest ask is at bottom */}
      <div className="border-b border-white/[0.04]">
        {[...asks].reverse().map((entry, i) => (
          <div
            key={`ask-${i}`}
            className="relative grid grid-cols-3 gap-2 px-5 py-1.5 text-xs font-mono hover:bg-white/[0.02] transition-colors"
          >
            {/* Background bar */}
            <div
              className="absolute inset-y-0 right-0 bg-danger/[0.06]"
              style={{ width: `${(entry.total / maxTotal) * 100}%` }}
            />
            <motion.span
              key={entry.price}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="relative text-danger/80"
            >
              {entry.price.toFixed(2)}
            </motion.span>
            <motion.span
              key={`${entry.amount}-a`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="relative text-right text-white/40"
            >
              {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </motion.span>
            <span className="relative text-right text-white/25">
              {entry.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      {/* Spread indicator */}
      <div className="flex items-center justify-center py-2 border-b border-white/[0.04] bg-white/[0.01]">
        <span className="text-xs font-mono text-neon-orange font-medium">
          {((asks[0]?.price ?? 0) - (bids[0]?.price ?? 0)).toFixed(2)} KSH spread
        </span>
      </div>

      {/* Bids (buys) */}
      <div>
        {bids.map((entry, i) => (
          <div
            key={`bid-${i}`}
            className="relative grid grid-cols-3 gap-2 px-5 py-1.5 text-xs font-mono hover:bg-white/[0.02] transition-colors"
          >
            {/* Background bar */}
            <div
              className="absolute inset-y-0 right-0 bg-success/[0.06]"
              style={{ width: `${(entry.total / maxTotal) * 100}%` }}
            />
            <motion.span
              key={entry.price}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="relative text-success/80"
            >
              {entry.price.toFixed(2)}
            </motion.span>
            <motion.span
              key={`${entry.amount}-b`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="relative text-right text-white/40"
            >
              {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </motion.span>
            <span className="relative text-right text-white/25">
              {entry.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
