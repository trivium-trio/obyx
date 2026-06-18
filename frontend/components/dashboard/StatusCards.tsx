"use client";

import { motion, Variants } from "framer-motion";
import { GlowCard } from "@/components/ui/GlowCard";
import { statusCards } from "@/lib/mock-data";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

export function StatusCards() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {statusCards.map((card) => (
        <motion.div key={card.title} variants={itemVariants}>
          <GlowCard
            glowColor={`${card.accent}30`}
            className="h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                {card.title}
              </span>
              <span className="text-xl">{card.icon}</span>
            </div>

            {/* Value */}
            <h3
              className="text-xl font-bold font-mono mb-1"
              style={{ color: card.accent }}
            >
              {card.value}
            </h3>
            <p className="text-xs text-white/30 mb-5">{card.subtitle}</p>

            {/* Progress bar */}
            <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${card.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${card.accent}60, ${card.accent})`,
                  boxShadow: `0 0 12px ${card.accent}40`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono text-white/20">0</span>
              <span
                className="text-[10px] font-mono"
                style={{ color: `${card.accent}80` }}
              >
                {card.progress}%
              </span>
            </div>
          </GlowCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
