"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Coins } from "lucide-react";

const proofs = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description:
      "End-to-end encryption with multi-sig custody. Your funds never touch a centralized wallet.",
    stat: "256-bit",
    statLabel: "Encryption",
  },
  {
    icon: Zap,
    title: "< 30s Settlement",
    description:
      "Near-instant swaps powered by on-chain liquidity pools. No waiting for bank confirmations.",
    stat: "< 30s",
    statLabel: "Avg. Time",
  },
  {
    icon: Coins,
    title: "0.5% Flat Fee",
    description:
      "Transparent pricing with no hidden charges, no spread markup, no withdrawal fees.",
    stat: "0.5%",
    statLabel: "Flat Fee",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function TrustSection() {
  return (
    <section className="relative py-24 px-6">
      {/* Section divider gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Built for trust
          </h2>
          <p className="text-sm text-white/35 max-w-md mx-auto">
            Every swap is secured, audited, and settled on-chain.
            Zero compromise.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {proofs.map((proof) => (
            <motion.div
              key={proof.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-white/[0.06] bg-surface-800/50 p-7 transition-colors hover:border-white/[0.1] hover:bg-surface-800/80"
            >
              {/* Icon */}
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-neon-orange/8 border border-neon-orange/10 group-hover:bg-neon-orange/12 transition-colors">
                <proof.icon className="h-5 w-5 text-neon-orange/80" />
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-semibold text-white mb-2">
                {proof.title}
              </h3>
              <p className="text-sm text-white/35 leading-relaxed mb-5">
                {proof.description}
              </p>

              {/* Stat */}
              <div className="flex items-baseline gap-2 pt-4 border-t border-white/[0.04]">
                <span className="text-xl font-bold font-mono text-neon-orange">
                  {proof.stat}
                </span>
                <span className="text-xs text-white/30">{proof.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
