"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/talk", label: "Talk" },
  { href: "/dashboard", label: "Dashboard", accent: true },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-4 left-1/2 z-50 w-[94%] max-w-5xl -translate-x-1/2"
      >
        <nav className="glass-strong rounded-2xl px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neon-orange/10 border border-neon-orange/20">
              <Zap className="h-4 w-4 text-neon-orange" />
              <div className="absolute inset-0 rounded-lg bg-neon-orange/5 group-hover:bg-neon-orange/10 transition-colors" />
            </div>
            <span className="font-mono text-lg font-bold tracking-wider text-white">
              OBYX
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-xl transition-colors duration-200",
                    isActive
                      ? "text-white"
                      : "text-white/50 hover:text-white/80",
                    link.accent && !isActive && "text-neon-orange/70 hover:text-neon-orange"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className={cn(
                        "absolute inset-0 rounded-xl",
                        link.accent
                          ? "bg-neon-orange/15 border border-neon-orange/20"
                          : "bg-white/[0.06] border border-white/[0.08]"
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {link.accent && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-orange animate-pulse" />
                    )}
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-strong rounded-2xl mt-2 p-4 md:hidden"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/[0.06] text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]",
                      link.accent && "text-neon-orange"
                    )}
                  >
                    {link.accent && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-orange" />
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
