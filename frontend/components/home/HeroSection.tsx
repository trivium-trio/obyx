"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center concentric-bg overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-neon-orange/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-info/[0.015] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-32">
        <div className="max-w-2xl">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-neon-orange/10 border border-neon-orange/15 px-4 py-1.5 text-xs font-medium text-neon-orange tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-orange animate-pulse" />
              LIVE ON MAINNET
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[0.95] tracking-tight mb-6"
          >
            DO MORE.
            <br />
            <span className="text-white/80">SWAP CASH</span>
            <br />
            <span className="text-white/60">FOR CODE.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg text-white/40 max-w-md leading-relaxed mb-10"
          >
            Convert KSH to USDC in seconds. No banks, no delays, no BS.
            The fastest on-ramp to the crypto economy.
          </motion.p>

          {/* GET STARTED CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-start gap-4 mb-10"
          >
            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-semibold bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.35)] transition-shadow duration-300 cursor-pointer"
              >
                GET STARTED
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </Link>
          </motion.div>

          {/* CTA Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center gap-8"
          >
            <div className="flex items-center gap-3 text-white/30">
              <div className="flex -space-x-2">
                {["🇰🇪", "🇺🇸", "🇬🇧", "🇳🇬"].map((flag, i) => (
                  <span
                    key={i}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-900 bg-surface-800 text-sm"
                  >
                    {flag}
                  </span>
                ))}
              </div>
              <span className="text-xs">6 currencies supported</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
