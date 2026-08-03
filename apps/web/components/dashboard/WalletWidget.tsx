"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Copy,
  ArrowLeftRight,
  Check,
  X,
  Plus,
  LogOut,
  Shield,
  ExternalLink,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/WalletContext";
import { useDynamicContext, useDynamicModals, DynamicWidget, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

// ── Helpers ──
const formatAddress = (addr: string) =>
  `${addr.slice(0, 6)}…${addr.slice(-4)}`;

export function WalletWidget() {
  const {
    walletAddress,
    circleAddress,
    activeWallet,
    setActiveWallet,
    isConnected,
    isInitializingCircle,
    circleError,
    disconnect,
    provisionObyxWallet,
  } = useWallet();

  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const { setShowLinkNewWalletModal } = useDynamicModals();
  const userWallets = useUserWallets();
  const { user } = useAuth();
  const router = useRouter();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowSwitchModal(false);
      }
    };
    if (showSwitchModal) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [showSwitchModal]);

  const copyToClipboard = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  // Get wallet connector name (MetaMask, Coinbase, etc.)
  const connectorName = primaryWallet?.connector?.name ?? "External Wallet";

  // Active display address
  const displayAddress =
    activeWallet === "embedded" ? circleAddress : walletAddress;
  const displayName =
    activeWallet === "embedded" ? "OBYX Wallet" : connectorName;

  // ── Disconnected State ──
  if (!isConnected) {
    if (!user) {
      return (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/auth/signup")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all duration-300 cursor-pointer"
        >
          <Wallet className="h-4 w-4" />
          Sign Up to Connect Wallet
        </motion.button>
      );
    }

    return (
      <>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all duration-300 cursor-pointer"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </motion.button>
        <ConnectWalletModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
        />
      </>
    );
  }

  // ── Connected State ──
  return (
    <div className="relative" ref={modalRef}>
      {/* Wallet Pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5"
      >
        {/* Main pill showing active wallet */}
        <div className="flex items-center gap-3 rounded-full bg-[#13121C] border border-white/[0.12] pl-2 pr-2.5 py-1.5 shadow-lg">
          {/* Wallet icon badge */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6B46C1] shrink-0">
            {activeWallet === "embedded" ? (
              <Wallet className="h-4 w-4 fill-current" />
            ) : (
              <ExternalLink className="h-4 w-4 text-[#6B46C1]" />
            )}
          </div>

          {/* Name + Address */}
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-sm font-bold text-white truncate leading-tight">
              {displayName}
            </span>
            <span className="text-xs font-mono text-[#7F56D9] truncate leading-tight mt-0.5">
              {displayAddress
                ? formatAddress(displayAddress)
                : isInitializingCircle
                ? "Initializing…"
                : circleError
                ? "Error"
                : "Not ready"}
            </span>
          </div>

          {/* Copy button */}
          {displayAddress && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(displayAddress);
              }}
              className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#7F56D9] transition-colors shrink-0"
              title="Copy address"
            >
              {copied === displayAddress ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Switch Wallet button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSwitchModal(!showSwitchModal)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1A1924] border border-white/[0.06] text-white/80 hover:text-white hover:bg-white/[0.08] transition-all duration-200 shadow-lg shrink-0"
          title="Switch wallet"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* ── Switch Wallet Popover (Top-Right Dropdown) ── */}
      <AnimatePresence>
        {showSwitchModal && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2.5 w-80 sm:w-88 rounded-2xl bg-surface-900/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Switch Wallet
                </h3>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Choose the active wallet for this session.
                </p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Wallet List */}
            <div className="px-3.5 pb-2.5 space-y-2">
              {/* OBYX Embedded Wallet (Circle SA) */}
              <button
                onClick={async () => {
                  setShowSwitchModal(false);
                  if (!circleAddress) {
                    await provisionObyxWallet();
                  } else {
                    setActiveWallet("embedded");
                  }
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-xl p-3 text-left transition-all duration-200",
                  activeWallet === "embedded"
                    ? "bg-neon-orange/10 border border-neon-orange/25"
                    : "bg-surface-800/50 border border-white/[0.06] hover:bg-surface-800 hover:border-white/[0.1]"
                )}
              >
                {/* Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon-orange/15 border border-neon-orange/20">
                  <Zap className="h-4 w-4 text-neon-orange" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      OBYX Wallet
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-neon-orange/15 text-neon-orange border border-neon-orange/20">
                      Embedded
                    </span>
                  </div>
                  <span className="text-xs font-mono text-white/35 block mt-0.5">
                    {circleAddress
                      ? formatAddress(circleAddress)
                      : isInitializingCircle
                      ? "Initializing…"
                      : "Not initialized"}
                  </span>
                </div>

                {/* Checkmark */}
                {activeWallet === "embedded" && (
                  <Check className="h-4 w-4 text-neon-orange shrink-0" />
                )}
              </button>

              {/* External EOA Wallets (Multi-wallet support) */}
              {userWallets.map((wallet) => {
                const isActive = activeWallet === "external" && wallet.address === walletAddress;
                return (
                  <button
                    key={wallet.id}
                    onClick={() => {
                      if (wallet.address !== walletAddress) {
                        wallet.connector.setPrimaryWallet();
                      }
                      setActiveWallet("external");
                      setShowSwitchModal(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-xl p-3 text-left transition-all duration-200",
                      isActive
                        ? "bg-info/10 border border-info/25"
                        : "bg-surface-800/50 border border-white/[0.06] hover:bg-surface-800 hover:border-white/[0.1]"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/15 border border-info/20">
                      <ExternalLink className="h-4 w-4 text-info" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {wallet.connector?.name || "External Wallet"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-info/15 text-info border border-info/20">
                          External
                        </span>
                      </div>
                      <span className="text-xs font-mono text-white/35 block mt-0.5">
                        {formatAddress(wallet.address)}
                      </span>
                    </div>

                    {/* Checkmark */}
                    {isActive && (
                      <Check className="h-4 w-4 text-info shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Link New Wallet */}
            <div className="px-3.5 pb-2.5">
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  if (setShowLinkNewWalletModal && primaryWallet) {
                    setShowLinkNewWalletModal(true);
                  } else {
                    setShowAuthFlow(true);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full rounded-xl p-2.5 border border-dashed border-white/[0.14] text-xs font-medium text-white/60 hover:text-neon-orange hover:border-neon-orange/30 hover:bg-neon-orange/5 transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Link a new external wallet
              </button>
            </div>

            {/* Divider + Disconnect */}
            <div className="border-t border-white/[0.06] px-3.5 py-2.5">
              <button
                onClick={async () => {
                  setShowSwitchModal(false);
                  await disconnect();
                }}
                className="flex items-center gap-2 w-full rounded-xl px-2.5 py-2 text-xs font-medium text-white/40 hover:text-danger hover:bg-danger/5 transition-all duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Connect Wallet Modal ──
function ConnectWalletModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { setShowAuthFlow } = useDynamicContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl bg-surface-900 border border-white/[0.05] shadow-2xl p-6 relative"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.05] transition-colors text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              if (typeof window !== 'undefined') {
                localStorage.setItem('obyx_active_wallet', 'external');
              }
              setShowAuthFlow(true);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 border border-white/[0.06] hover:bg-surface-800 transition-colors text-left group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/15 border border-info/20 group-hover:scale-105 transition-transform">
              <ExternalLink className="h-5 w-5 text-info" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">External Wallet</div>
              <div className="text-sm text-white/40">Use your browser wallet (MetaMask, Coinbase, etc.)</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              if (typeof window !== 'undefined') {
                localStorage.setItem('obyx_auto_provision', 'true');
                localStorage.setItem('obyx_active_wallet', 'embedded');
              }
              setShowAuthFlow(true);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-neon-orange/10 border border-neon-orange/20 hover:bg-neon-orange/15 transition-colors text-left group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-orange/15 border border-neon-orange/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-neon-orange" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">OBYX Smart Account</div>
              <div className="text-sm text-white/40">Gasless transactions & embedded experience</div>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
