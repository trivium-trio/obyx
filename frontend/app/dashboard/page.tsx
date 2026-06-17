"use client";

import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { TransactionStream } from "@/components/dashboard/TransactionStream";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { OrderBook } from "@/components/dashboard/OrderBook";

export default function DashboardPage() {
  return (
    <div className="cyber-bg min-h-screen pt-24 pb-16">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <DashboardHero />

        {/* Main grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Stream - 2 cols */}
          <div className="lg:col-span-2">
            <TransactionStream />
          </div>

          {/* Order Book - 1 col */}
          <div className="lg:col-span-1">
            <OrderBook />
          </div>
        </div>

        {/* Status Cards */}
        <div className="mt-6">
          <StatusCards />
        </div>

        {/* Parental Advisory Badge */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-lg border-2 border-white/10 bg-surface-900/60 px-5 py-3">
            <div className="border border-white/20 px-2 py-0.5">
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider leading-none block">
                PARENTAL
              </span>
              <span className="text-[7px] font-bold text-white/50 uppercase tracking-wider leading-none block">
                ADVISORY
              </span>
            </div>
            <span className="text-xs font-mono text-white/30">
              EXPLICIT VOLATILITY CONTENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
