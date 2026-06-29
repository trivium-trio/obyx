"use client";

import { motion } from "framer-motion";
import { SwapWidget } from "@/components/home/SwapWidget";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-white/35 font-mono">
          {user?.email ?? "User"} · Ready to swap
        </p>
      </motion.div>

      {/* Swap Widget */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <SwapWidget />
      </motion.div>

      {/* Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest mb-5">
          Market Status
        </h2>
        <StatusCards />
      </motion.div>
    </div>
  );
}
