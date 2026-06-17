"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Wallet, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { currencies, tokens, conversionRates } from "@/lib/mock-data";
import type { Currency, Token } from "@/lib/mock-data";

export function SwapWidget() {
  const [fiatCurrency, setFiatCurrency] = useState<Currency>(currencies[0]);
  const [cryptoToken, setCryptoToken] = useState<Token>(tokens[0]);
  const [fiatAmount, setFiatAmount] = useState<string>("10000");
  const [isReversed, setIsReversed] = useState(false);
  const [showFiatDropdown, setShowFiatDropdown] = useState(false);
  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const rate = conversionRates[cryptoToken.symbol]?.[fiatCurrency.code] ?? 1;

  const computedValue = useMemo(() => {
    const amt = parseFloat(fiatAmount.replace(/,/g, "")) || 0;
    if (isReversed) {
      return (amt * rate).toLocaleString("en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return (amt / rate).toLocaleString("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }, [fiatAmount, rate, isReversed]);

  const handleSwapDirection = useCallback(() => {
    setIsReversed((prev) => !prev);
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnecting(true);
    setTimeout(() => setIsConnecting(false), 2000);
  }, []);

  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-md">
        {/* Widget label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest">
            Instant Swap
          </h2>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="glass-card rounded-3xl p-6 relative"
        >
          {/* ── PAY Section ── */}
          <div className="mb-2">
            <label className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3 block">
              {isReversed ? "You receive" : "You pay"}
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
              {/* Currency Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFiatDropdown(!showFiatDropdown);
                    setShowCryptoDropdown(false);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white hover:bg-white/[0.1] transition-colors"
                >
                  <span className="text-lg">{fiatCurrency.flag}</span>
                  <span>{fiatCurrency.code}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                </button>

                <AnimatePresence>
                  {showFiatDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 left-0 z-30 w-48 rounded-xl glass-strong p-2"
                    >
                      {currencies.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setFiatCurrency(c);
                            setShowFiatDropdown(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                            c.code === fiatCurrency.code
                              ? "bg-neon-orange/10 text-neon-orange"
                              : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="font-medium">{c.code}</span>
                          <span className="text-xs text-white/30 ml-auto">
                            {c.name}
                          </span>
                          {c.code === fiatCurrency.code && (
                            <Check className="h-3.5 w-3.5 text-neon-orange ml-1" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amount Input */}
              <input
                type="text"
                value={fiatAmount}
                onChange={(e) =>
                  setFiatAmount(e.target.value.replace(/[^0-9.,]/g, ""))
                }
                placeholder="0.00"
                className="flex-1 bg-transparent text-right text-2xl font-semibold text-white placeholder:text-white/20 outline-none font-mono"
              />
            </div>
          </div>

          {/* ── Swap Direction Button ── */}
          <div className="relative flex items-center justify-center py-2 z-20">
            <div className="absolute inset-x-0 top-1/2 border-t border-white/[0.04]" />
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSwapDirection}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-800 border border-white/[0.08] text-white/50 hover:text-neon-orange hover:border-neon-orange/30 transition-colors"
            >
              <motion.div
                animate={{ rotate: isReversed ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <ArrowUpDown className="h-4 w-4" />
              </motion.div>
            </motion.button>
          </div>

          {/* ── RECEIVE Section ── */}
          <div className="mb-6">
            <label className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3 block">
              {isReversed ? "You pay" : "You receive"}
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
              {/* Token Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCryptoDropdown(!showCryptoDropdown);
                    setShowFiatDropdown(false);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white hover:bg-white/[0.1] transition-colors"
                >
                  <span className="text-lg">{cryptoToken.icon}</span>
                  <span>{cryptoToken.symbol}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                </button>

                <AnimatePresence>
                  {showCryptoDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full mt-2 left-0 z-30 w-48 rounded-xl glass-strong p-2"
                    >
                      {tokens.map((t) => (
                        <button
                          key={t.symbol}
                          onClick={() => {
                            setCryptoToken(t);
                            setShowCryptoDropdown(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                            t.symbol === cryptoToken.symbol
                              ? "bg-neon-orange/10 text-neon-orange"
                              : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          <span className="text-lg">{t.icon}</span>
                          <span className="font-medium">{t.symbol}</span>
                          <span className="text-xs text-white/30 ml-auto">
                            {t.name}
                          </span>
                          {t.symbol === cryptoToken.symbol && (
                            <Check className="h-3.5 w-3.5 text-neon-orange ml-1" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Computed Value */}
              <div className="flex-1 text-right">
                <span className="text-2xl font-semibold text-white font-mono">
                  {computedValue}
                </span>
              </div>
            </div>
          </div>

          {/* ── Rate Display ── */}
          <div className="flex items-center justify-between text-xs text-white/30 mb-5 px-1">
            <span>
              1 {cryptoToken.symbol} = {rate.toLocaleString()} {fiatCurrency.code}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Best rate
            </span>
          </div>

          {/* ── CTA Button ── */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={isConnecting}
            className={cn(
              "w-full rounded-2xl py-4 text-sm font-semibold transition-all duration-300",
              "bg-gradient-to-r from-neon-orange to-neon-amber text-white",
              "hover:shadow-[0_0_30px_rgba(255,107,0,0.3)]",
              "disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Wallet className="h-4 w-4" />
              {isConnecting ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Connecting...
                </motion.span>
              ) : (
                "Connect Wallet & Swap"
              )}
            </span>
          </motion.button>

          {/* ── Fee info ── */}
          <p className="text-center text-[11px] text-white/20 mt-3">
            0.5% flat fee · Powered by on-chain liquidity
          </p>
        </motion.div>
      </div>
    </section>
  );
}
