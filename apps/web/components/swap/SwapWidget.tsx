"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { conversionRates } from "@/lib/mock-data";
import { useWallet } from "@/lib/WalletContext";
import { useActiveUsdcBalance } from "@/lib/hooks/useActiveUsdcBalance";
import { USDCIcon, USDTIcon, WXMIcon } from "./shared/icons";

import SwapToCashModal from "./modals/SwapToCashModal";
import SwapToCryptoModal from "./modals/SwapToCryptoModal";
import WalletTransferModal from "./modals/WalletTransferModal";

// ════════════════════════════════════════════════════════
// DROPDOWN COMPONENT
// ════════════════════════════════════════════════════════

const TOKENS_LIST = [
  { id: 1, symbol: "USDC", network: "Base", icon: USDCIcon, isAvailable: true, nwIconColor: "bg-blue-500" },
  { id: 2, symbol: "USDT", network: "Lisk", icon: USDTIcon, isAvailable: false, nwIconColor: "bg-cyan-500" },
  { id: 3, symbol: "USDC", network: "Scroll", icon: USDCIcon, isAvailable: false, nwIconColor: "bg-[#FFF0DD]" },
  { id: 4, symbol: "WXM", network: "Arbitrum", icon: WXMIcon, isAvailable: false, nwIconColor: "bg-blue-400" },
  { id: 5, symbol: "USDC", network: "Polygon", icon: USDCIcon, isAvailable: false, nwIconColor: "bg-purple-500" },
  { id: 6, symbol: "USDT", network: "Polygon", icon: USDTIcon, isAvailable: false, nwIconColor: "bg-purple-500" },
  { id: 7, symbol: "USDC", network: "BNB Chain", icon: USDCIcon, isAvailable: false, nwIconColor: "bg-yellow-400" },
];

function TokenNetworkDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      <span className="text-xs text-white/40 mb-2 block">Select Token & Network</span>

      {/* Active Selection Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-3 bg-[#1A1924] border border-white/[0.05] rounded-xl px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors w-full sm:w-auto min-w-[200px]"
      >
        <div className="flex items-center gap-2">
          <USDCIcon className="w-5 h-5" />
          <span className="font-semibold text-white text-[15px]">USDC</span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-1"></div>
          <span className="text-white/50 text-sm">Base</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 top-[calc(100%+8px)] left-0 w-full sm:w-[320px] bg-[#1A1924] border border-white/[0.05] rounded-xl shadow-2xl py-2 max-h-[300px] overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {TOKENS_LIST.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors",
                    item.isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                  )}
                  onClick={() => {
                    if (item.isAvailable) setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6" />
                    <span className="font-bold text-white">{item.symbol}</span>
                    <div className="flex items-center gap-1.5 text-white/50 text-sm">
                      <div className={cn("w-3 h-3 rounded-md", item.nwIconColor)} />
                      {item.network}
                    </div>
                  </div>

                  {!item.isAvailable && (
                    <span className="text-[9px] font-mono uppercase bg-white/[0.05] text-white/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Coming Soon
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MAIN WIDGET COMPONENT
// ════════════════════════════════════════════════════════

export function SwapWidget() {
  const { isConnected, activeWallet } = useWallet();
  const [showBalance, setShowBalance] = useState(true);
  const [activeModal, setActiveModal] = useState<"cash" | "crypto" | "transfer" | null>(null);
  const { balance: usdcBalance, isLoading: isBalanceLoading } = useActiveUsdcBalance();
  const rate = conversionRates["USDC"]?.["KSH"] || 129.50;

  return (
    <>
      <div className="w-full bg-[#13121C] rounded-[24px] p-6 sm:p-8 border border-white/[0.04] shadow-2xl relative overflow-hidden">
        {/* Top: Balance Area */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-white/40 tracking-widest uppercase">
              Wallet Balance
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">KES</span>
              <span className="text-4xl font-bold text-white/90 truncate max-w-full">
                {isBalanceLoading ? "Loading…" : showBalance ? (usdcBalance * rate).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••"}
              </span>
            </div>
            <span className="text-sm text-white/40 font-mono mt-1">
              {isBalanceLoading ? "Loading…" : showBalance ? `${usdcBalance.toFixed(6)} USDC` : "•••••••• USDC"}
            </span>
          </div>
        </div>

        {/* Middle: Responsive Token Selection */}
        <div className="mb-8">
          <TokenNetworkDropdown />
        </div>

        {/* Bottom: Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setActiveModal("cash")}
            className="flex-1 flex items-center justify-center gap-2 bg-neon-orange hover:bg-neon-amber text-white px-5 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-[0_0_15px_rgba(255,107,0,0.1)]"
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span className="truncate">Swap to Cash</span>
          </button>

          <button
            onClick={() => setActiveModal("crypto")}
            className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-emerald-500 text-[#0A1A14] px-5 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-[0_0_15px_rgba(0,211,149,0.1)]"
          >
            <ArrowDownLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Swap to Crypto</span>
          </button>

          <button
            onClick={() => setActiveModal("transfer")}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1A1924] border border-white/[0.05] hover:bg-white/[0.08] text-white px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Wallet Transfer</span>
          </button>
        </div>

        {/* ── Dynamic Fee Indicator ── */}
        <p className="text-center text-[11px] text-white/20 mt-4">
          {isConnected && activeWallet === "embedded"
            ? "0% gas fee · Sponsored by Circle Paymaster · Base Sepolia"
            : isConnected && activeWallet === "external"
              ? "Using External Wallet · Base Sepolia"
              : "0.5% flat fee · Powered by on-chain liquidity"}
        </p>
      </div>

      <AnimatePresence>
        {activeModal === "cash" && <SwapToCashModal isOpen={true} onClose={() => setActiveModal(null)} />}
        {activeModal === "crypto" && <SwapToCryptoModal isOpen={true} onClose={() => setActiveModal(null)} />}
        {activeModal === "transfer" && <WalletTransferModal isOpen={true} onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
    </>
  );
}
