"use client";

import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GlitchText({
  text,
  className,
  as: Tag = "h2",
}: GlitchTextProps) {
  return (
    <Tag
      className={cn("relative inline-block font-mono font-bold", className)}
    >
      {/* Base text */}
      <span className="relative z-10">{text}</span>

      {/* Glitch layers */}
      <span
        aria-hidden
        className="absolute inset-0 z-0 text-neon-orange opacity-70"
        style={{
          animation: "glitch 2s infinite",
          animationDelay: "0.1s",
          clipPath: "inset(20% 0 30% 0)",
        }}
      >
        {text}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 z-0 text-info opacity-70"
        style={{
          animation: "glitch 2s infinite reverse",
          animationDelay: "0.3s",
          clipPath: "inset(50% 0 10% 0)",
        }}
      >
        {text}
      </span>
    </Tag>
  );
}
