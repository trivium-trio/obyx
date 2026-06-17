"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/components/ui/GlitchText";
import { Terminal, Radio } from "lucide-react";

export function DashboardHero() {
  return (
    <section className="relative py-16 text-center overflow-hidden">
      {/* Ambient neon glow */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,107,0,0.12) 0%, rgba(255,159,0,0.05) 40%, transparent 70%)",
            animation: "glow-pulse 3s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center gap-2 rounded-full bg-neon-orange/10 border border-neon-orange/20 px-4 py-1.5 text-xs font-mono text-neon-orange tracking-wider mb-8"
        >
          <Radio className="h-3 w-3 animate-pulse" />
          SIGNAL LIVE
        </motion.div>

        {/* Glitch title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 12,
            delay: 0.2,
          }}
        >
          <GlitchText
            text="THE TERMINAL"
            as="h1"
            className="text-4xl sm:text-5xl md:text-6xl text-neon-orange text-glow-orange"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-sm text-white/30 font-mono flex items-center justify-center gap-2"
        >
          <Terminal className="h-3.5 w-3.5" />
          real-time market chaos · powered by degeneracy
        </motion.p>

        {/* Ticker bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 overflow-hidden border-y border-white/[0.04] py-2.5"
        >
          <div
            className="flex whitespace-nowrap gap-8 text-xs font-mono"
            style={{ animation: "ticker 25s linear infinite" }}
          >
            {[
              { pair: "KSH/USDC", price: "129.50", change: "+0.12%", up: true },
              { pair: "ETH/USD", price: "3,750.00", change: "-1.34%", up: false },
              { pair: "BTC/USD", price: "68,500", change: "+2.81%", up: true },
              { pair: "NGN/USDT", price: "1,580", change: "-0.05%", up: false },
              { pair: "EUR/USDC", price: "1.087", change: "+0.03%", up: true },
              { pair: "GBP/DAI", price: "1.266", change: "+0.18%", up: true },
              { pair: "KSH/USDC", price: "129.50", change: "+0.12%", up: true },
              { pair: "ETH/USD", price: "3,750.00", change: "-1.34%", up: false },
              { pair: "BTC/USD", price: "68,500", change: "+2.81%", up: true },
              { pair: "NGN/USDT", price: "1,580", change: "-0.05%", up: false },
              { pair: "EUR/USDC", price: "1.087", change: "+0.03%", up: true },
              { pair: "GBP/DAI", price: "1.266", change: "+0.18%", up: true },
            ].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="text-white/40">{t.pair}</span>
                <span className="text-white/60">{t.price}</span>
                <span className={t.up ? "text-success" : "text-danger"}>
                  {t.change}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
