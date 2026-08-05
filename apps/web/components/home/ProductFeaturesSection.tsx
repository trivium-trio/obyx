"use client";

import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, Send } from "lucide-react";

const features = [
  {
    title: "Buy Crypto with Cash",
    subtitle: "Onramp",
    description:
      "Deposit KSH via M-Pesa or bank transfer. Receive USDC in your wallet in under 30 seconds.",
    icon: ArrowDownToLine,
  },
  {
    title: "Cash Out Instantly",
    subtitle: "Offramp",
    description:
      "Convert USDC or USDT back to local currency. Withdraw directly to M-Pesa or your bank account.",
    icon: ArrowUpFromLine,
  },
  {
    title: "Send Anywhere",
    subtitle: "Wallet-to-Wallet",
    description:
      "Transfer stablecoins cross-chain to any wallet address. One address, any network, zero bridging hassle.",
    icon: Send,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: "easeOut" },
  }),
};

export function ProductFeaturesSection() {
  return (
    <section className="relative py-24 px-6 bg-surface-950">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-3">
            What We Offer
          </h2>
          <p className="text-sm text-white/35 max-w-lg mx-auto">
            A comprehensive suite of tools to move your value freely across the globe and between economies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative rounded-2xl border border-white/[0.06] bg-surface-800/40 p-8 hover:border-white/[0.1] hover:bg-surface-800/70 transition-all duration-300"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-neon-orange/8 border border-neon-orange/10 group-hover:bg-neon-orange/12 transition-colors">
                <feature.icon className="h-6 w-6 text-neon-orange/80" />
              </div>
              
              <div className="text-xs font-semibold text-neon-orange tracking-wider uppercase mb-2">
                {feature.subtitle}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
