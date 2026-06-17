"use client";

import { motion, type Easing } from "framer-motion";
import { ArrowRight, Globe, Users, Layers, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Deposit Cash",
    description:
      "Send KSH via M-Pesa, bank transfer, or any supported local payment rail. Funds are confirmed in real-time.",
    icon: Zap,
  },
  {
    number: "02",
    title: "Match & Settle",
    description:
      "Our P2P liquidity engine finds the best rate across providers. Smart contracts handle escrow and settlement atomically.",
    icon: Layers,
  },
  {
    number: "03",
    title: "Receive Crypto",
    description:
      "USDC, USDT, or DAI lands in your wallet within seconds. On-chain, verifiable, yours.",
    icon: Globe,
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: "easeOut" as Easing },
  }),
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen pt-28">
      {/* ── Abstract SVG Background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
          viewBox="0 0 1440 900"
          fill="none"
        >
          {/* Concentric smooth tracks inspired by reference image 1 */}
          {[...Array(8)].map((_, i) => (
            <ellipse
              key={i}
              cx={400}
              cy={450}
              rx={200 + i * 80}
              ry={180 + i * 70}
              stroke="white"
              strokeWidth={1.5}
              fill="none"
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <ellipse
              key={`r-${i}`}
              cx={1100}
              cy={400}
              rx={150 + i * 65}
              ry={140 + i * 55}
              stroke="white"
              strokeWidth={1}
              fill="none"
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* ── Hero ── */}
        <section className="py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/50 tracking-wide mb-6">
              <Users className="h-3 w-3" />
              OUR MISSION
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6"
          >
            Bridging cash
            <br />
            <span className="text-white/60">to the on-chain economy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base text-white/35 max-w-lg mx-auto leading-relaxed"
          >
            OBYX is a peer-to-peer liquidity infrastructure that lets anyone
            convert local currency to stablecoins — without banks, without
            delays, without borders.
          </motion.p>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ── How It Works ── */}
        <section className="py-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-3">
              How it works
            </h2>
            <p className="text-sm text-white/35">
              Three steps. Under a minute. On-chain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative rounded-2xl border border-white/[0.06] bg-surface-800/40 p-8 hover:border-white/[0.1] hover:bg-surface-800/70 transition-all duration-300"
              >
                {/* Step Number */}
                <span className="block text-5xl font-bold font-mono text-white/[0.04] mb-4">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neon-orange/8 border border-neon-orange/10">
                  <step.icon className="h-4.5 w-4.5 text-neon-orange/70" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-white/35 leading-relaxed">
                  {step.description}
                </p>

                {/* Arrow connector (on md+) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="h-4 w-4 text-white/10" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ── Infrastructure ── */}
        <section className="py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-white mb-5">
                P2P liquidity,
                <br />
                <span className="text-white/50">institutional grade</span>
              </h2>
              <p className="text-sm text-white/35 leading-relaxed mb-6">
                Our matching engine connects local cash providers with
                on-chain liquidity in real-time. Every swap is secured by
                smart contract escrow — no custodial risk, no middlemen.
              </p>
              <div className="space-y-3">
                {[
                  "Non-custodial smart contract escrow",
                  "Multi-provider rate aggregation",
                  "Real-time KYC/AML compliance layer",
                  "24/7 automated settlement",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-neon-orange/60" />
                    <span className="text-sm text-white/50">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "$12M+", label: "Volume processed" },
                  { value: "45K+", label: "Swaps completed" },
                  { value: "< 28s", label: "Avg. settlement" },
                  { value: "99.97%", label: "Uptime" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i + 0.3 }}
                    className="rounded-xl border border-white/[0.06] bg-surface-800/50 p-5 text-center"
                  >
                    <span className="block text-2xl font-bold font-mono text-neon-orange mb-1">
                      {stat.value}
                    </span>
                    <span className="text-xs text-white/30">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
