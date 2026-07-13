"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  Wallet,
  ChevronDown,
  Check,
  Loader2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currencies, tokens, conversionRates } from "@/lib/mock-data";
import type { Currency, Token } from "@/lib/mock-data";
import { useWallet } from "@/lib/WalletContext";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { OnrampService, OfframpService } from "@/lib/api/client";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";
import { PhoneNumberModal } from "@/components/dashboard/PhoneNumberModal";

export function SwapWidget() {
  const { refreshTransactions, transactions } = useTransactionHistory();

  const availableCurrencies = useMemo(() => currencies.filter((c) => c.code === "KSH"), []);
  const availableTokens = useMemo(() => tokens.filter((t) => t.symbol === "USDC"), []);

  const [fiatCurrency, setFiatCurrency] = useState<Currency>(availableCurrencies[0]);
  const [cryptoToken, setCryptoToken] = useState<Token>(availableTokens[0]);
  const [fiatAmount, setFiatAmount] = useState<string>("10000");
  const [isReversed, setIsReversed] = useState(false);
  const [showFiatDropdown, setShowFiatDropdown] = useState(false);
  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Swap execution state
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState<{
    txHash: string;
    userOpHash: string;
  } | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  // Wallet state
  const {
    isConnected,
    isInitializingCircle,
    circleAddress,
    userPhone,
    setUserPhone,
    sendGaslessSwap,
  } = useWallet();
  const { setShowAuthFlow } = useDynamicContext();

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

  // Core swap execution
  const executeSwap = useCallback(async (phone?: string) => {
    setIsSwapping(true);
    setSwapError(null);
    setSwapResult(null);

    try {
      const amt = parseFloat(fiatAmount.replace(/,/g, "")) || 0;
      const usdcAmount = amt / rate;

      if (!isReversed) {
        // ON-RAMP: fiat -> crypto — pass phone directly to the API
        const res = await OnrampService.postOnrampInit({
          fiatAmount: amt,
          ...(phone ? { phoneNumber: phone } : {}),
        });
        const transactionId = res.data?.transactionId;
        if (!transactionId) throw new Error("No transaction ID returned");

        // Fire and Forget: Show optimistic success UI
        setSwapResult({ txHash: "pending", userOpHash: "pending" });
      } else {
        // OFF-RAMP: crypto -> fiat
        const res = await OfframpService.postOfframpInit({ usdcAmount });

        // Execute gasless transfer to treasury
        const gaslessResult = await sendGaslessSwap(circleAddress!, usdcAmount);
        const actualTxHash = gaslessResult.txHash;

        // Confirm
        await OfframpService.postOfframpConfirm({
          transactionId: res.data!.transactionId as string,
          txHash: actualTxHash,
        });
        
        setSwapResult({ txHash: actualTxHash, userOpHash: gaslessResult.userOpHash });
      }
      
      refreshTransactions();
    } catch (err: any) {
      console.error("Swap failed:", err);
      setSwapError(
        err.body?.error || err.message || "Swap failed. Please try again."
      );
    } finally {
      setIsSwapping(false);
    }
  }, [
    fiatAmount,
    isReversed,
    rate,
    circleAddress,
    sendGaslessSwap,
    refreshTransactions,
  ]);

  // Handle CTA button click
  const handleCTAClick = useCallback(async () => {
    // If not connected, open Dynamic wallet connect modal
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }

    // If Circle SA is still initializing, do nothing
    if (isInitializingCircle || !circleAddress) return;

    // For On-Ramp, require M-Pesa phone number
    if (!isReversed && !userPhone) {
      setShowPhoneModal(true);
      return;
    }

    await executeSwap(userPhone || undefined);
  }, [
    isConnected,
    isInitializingCircle,
    circleAddress,
    isReversed,
    userPhone,
    setShowAuthFlow,
    executeSwap,
  ]);

  const handlePhoneSuccess = useCallback(async (phone: string) => {
    setUserPhone(phone);
    setShowPhoneModal(false);
    await executeSwap(phone);
  }, [setUserPhone, executeSwap]);

  const hasPendingTransaction = useMemo(() => {
    return transactions.some(
      (tx) => {
        const isPendingStatus = tx.status === "PENDING" ||
          tx.status === "FIAT_PROCESSING" ||
          tx.status === "FIAT_RECEIVED" ||
          tx.status === "CRYPTO_PROCESSING";
          
        if (!isPendingStatus) return false;
        
        // Ignore stale pending transactions (older than 5 minutes)
        if (tx.updatedAt) {
          const txTime = new Date(tx.updatedAt).getTime();
          const now = Date.now();
          if (now - txTime > 5 * 60 * 1000) return false;
        }
        return true;
      }
    );
  }, [transactions]);

  // Determine button state
  const getButtonState = () => {
    if (!isConnected)
      return { label: "Connect Wallet & Swap", disabled: false, showWallet: true };
    if (isInitializingCircle)
      return { label: "Initializing Smart Account…", disabled: true, showLoader: true };
    if (!circleAddress)
      return { label: "Smart Account Not Ready", disabled: true, showShield: true };
    if (hasPendingTransaction)
      return { label: "Previous Swap Processing…", disabled: true, showLoader: true };
    if (isSwapping)
      return { label: "Executing Swap…", disabled: true, showLoader: true };
      
    const amt = parseFloat(fiatAmount.replace(/,/g, "")) || 0;
    if (amt <= 0)
      return { label: "Enter Amount", disabled: true, showShield: true };

    return { label: "Swap (Gasless)", disabled: false, showShield: true };
  };

  const buttonState = getButtonState();

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
              {/* Currency Selector (Static) */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white">
                  <span className="text-lg">{fiatCurrency.flag}</span>
                  <span>{fiatCurrency.code}</span>
                </div>
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
              {/* Token Selector (Static) */}
              <div className="relative">
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-white">
                  <span className="text-lg">{cryptoToken.icon}</span>
                  <span>{cryptoToken.symbol}</span>
                </div>
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
              {isConnected ? "Base Sepolia" : "Best rate"}
            </span>
          </div>

          {/* ── CTA Button ── */}
          <motion.button
            whileHover={{ scale: buttonState.disabled ? 1 : 1.01 }}
            whileTap={{ scale: buttonState.disabled ? 1 : 0.98 }}
            onClick={handleCTAClick}
            disabled={buttonState.disabled}
            className={cn(
              "w-full rounded-2xl py-4 text-sm font-semibold transition-all duration-300",
              "bg-gradient-to-r from-neon-orange to-neon-amber text-white",
              "hover:shadow-[0_0_30px_rgba(255,107,0,0.3)]",
              "disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {buttonState.showLoader ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : buttonState.showShield ? (
                <Shield className="h-4 w-4" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {buttonState.label}
            </span>
          </motion.button>

          {/* ── Swap Result ── */}
          <AnimatePresence>
            {swapResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-xl bg-success/10 border border-success/20 p-4"
              >
                <p className="text-xs text-success font-medium mb-2">
                  {swapResult.txHash === 'pending'
                    ? "✓ Prompt sent! Please check your phone to complete."
                    : "✓ Swap executed successfully (gasless)"}
                </p>
                {swapResult.txHash !== 'pending' && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${swapResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-mono text-success/70 hover:text-success transition-colors"
                  >
                    <span>
                      Tx: {swapResult.txHash.slice(0, 10)}...
                      {swapResult.txHash.slice(-8)}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Swap Error ── */}
          <AnimatePresence>
            {swapError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-xl bg-danger/10 border border-danger/20 p-4"
              >
                <p className="text-xs text-danger">{swapError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Fee info ── */}
          <p className="text-center text-[11px] text-white/20 mt-3">
            {isConnected
              ? "0% gas fee · Sponsored by Circle Paymaster · Base Sepolia"
              : "0.5% flat fee · Powered by on-chain liquidity"}
          </p>
        </motion.div>
      </div>

      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={handlePhoneSuccess}
      />
    </section>
  );
}
