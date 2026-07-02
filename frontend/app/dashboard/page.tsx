"use client";

import { motion } from "framer-motion";
import { SwapWidget } from "@/components/home/SwapWidget";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { useAuth } from "@/lib/AuthContext";
import { useWallet } from "@/lib/WalletContext";
import { Shield, Wallet, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { walletAddress, circleAddress, isConnected, isInitializingCircle, circleError } =
    useWallet();

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

        {/* Wallet Info Panel */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex flex-wrap gap-3"
          >
            {/* EOA Wallet */}
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5">
              <Wallet className="h-3.5 w-3.5 text-neon-orange" />
              <span className="text-xs text-white/40 mr-1">EOA</span>
              <a
                href={`https://sepolia.basescan.org/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-white/70 hover:text-neon-orange transition-colors flex items-center gap-1"
              >
                {walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : "—"}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            {/* Circle Smart Account */}
            {isInitializingCircle && (
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5">
                <Shield className="h-3.5 w-3.5 text-white/30 animate-pulse" />
                <span className="text-xs font-mono text-white/30">
                  Initializing Smart Account…
                </span>
              </div>
            )}

            {circleAddress && (
              <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-2.5">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs text-violet-300/60 mr-1">Smart Account</span>
                <a
                  href={`https://sepolia.basescan.org/address/${circleAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  {`${circleAddress.slice(0, 6)}...${circleAddress.slice(-4)}`}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}

            {circleError && (
              <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5">
                <span className="text-xs text-danger">
                  Circle SA Error: {circleError}
                </span>
              </div>
            )}
          </motion.div>
        )}
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
