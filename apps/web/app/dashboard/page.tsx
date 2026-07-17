"use client";

import { motion } from "framer-motion";
import { SwapWidget } from "@/components/home/SwapWidget";
import { TransactionHistoryTable } from "@/components/dashboard/TransactionHistoryTable";
import { useAuth } from "@/lib/AuthContext";
import { WalletWidget } from "@/components/dashboard/WalletWidget";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      {/* Welcome header + Wallet Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
            Welcome back 👋
          </h1>
          <p className="text-sm text-white/35 font-mono">
            {user?.email ?? "User"} · Ready to swap
          </p>
        </div>

        {/* Wallet Widget in Body */}
        <div className="flex items-center justify-end">
          <WalletWidget />
        </div>
      </motion.div>

      {/* Swap Widget */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <SwapWidget />
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-5">
          Transaction History
        </h2>
        <TransactionHistoryTable />
      </motion.div>

    </div>
  );
}
