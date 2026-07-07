"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hoverScale?: number;
}

export function GlowCard({
  children,
  className,
  glowColor = "rgba(255, 107, 0, 0.15)",
  hoverScale = 1.02,
}: GlowCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: hoverScale,
        boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-surface-800/80 p-6 backdrop-blur-sm",
        "transition-colors duration-300",
        className
      )}
      style={{
        boxShadow: `0 0 15px ${glowColor.replace(/[\d.]+\)$/, "0.05)")}`,
      }}
    >
      {children}
    </motion.div>
  );
}
