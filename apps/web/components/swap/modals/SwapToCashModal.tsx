import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ArrowRightLeft, X, Zap, Loader2 } from "lucide-react";
import { conversionRates } from "@/lib/mock-data";
import { useWallet } from "@/lib/WalletContext";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { OfframpService } from "@/lib/api/client";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { USDCIcon } from "../shared/icons";
import { TransactionOverlay, TxOverlayState } from "../shared/TransactionOverlay";
import { useActiveUsdcBalance } from "@/lib/hooks/useActiveUsdcBalance";

export default function SwapToCashModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { circleAddress, sendGaslessSwap, isConnected, activeWallet } = useWallet();
  const { refreshTransactions } = useTransactionHistory();
  const { setShowAuthFlow } = useDynamicContext();
  const { balance: usdcBalance, refetch: refetchBalance } = useActiveUsdcBalance();
  const { user } = useAuth();
  const router = useRouter();

  const [cryptoAmount, setCryptoAmount] = useState("");
  const [phoneOrAccount, setPhoneOrAccount] = useState("");
  const [reason, setReason] = useState("");
  const [txState, setTxState] = useState<TxOverlayState>({ phase: "idle" });

  const resetModal = () => {
    setTxState({ phase: "idle" });
    setCryptoAmount("");
    setPhoneOrAccount("");
    setReason("");
  };

  const isSwapping = txState.phase !== "idle";

  // Dynamic rates
  const rate = conversionRates["USDC"]?.["KSH"] || 129.50;

  // Dynamic fee calculation (e.g. 0.5%)
  const fee = useMemo(() => {
    const amt = parseFloat(cryptoAmount) || 0;
    return amt * rate * 0.005;
  }, [cryptoAmount, rate]);

  const cashAmount = useMemo(() => {
    const amt = parseFloat(cryptoAmount) || 0;
    const calc = amt * rate - fee;
    return calc > 0 ? calc.toFixed(2) : "0.00";
  }, [cryptoAmount, rate, fee]);

  const handleSwap = async () => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }
    if (activeWallet === "external") {
      setTxState({ phase: "error", message: "Off-ramp from external wallets requires sending on-chain tx. Please switch to your embedded OBYX Wallet for gasless off-ramp." });
      return;
    }
    if (!circleAddress) return;

    setTxState({ phase: "executing", message: `Sending ${cryptoAmount} USDC to M-Pesa...` });
    try {
      const usdcAmt = parseFloat(cryptoAmount);
      if (!usdcAmt || usdcAmt <= 0) throw new Error("Enter a valid amount");

      const res = await OfframpService.postOfframpInit({ usdcAmount: usdcAmt });
      const gaslessResult = await sendGaslessSwap(circleAddress, usdcAmt);

      await OfframpService.postOfframpConfirm({
        transactionId: res.data!.transactionId as string,
        txHash: gaslessResult.txHash,
      });

      setTxState({
        phase: "success",
        summary: `${usdcAmt.toFixed(2)} USDC → KES ${cashAmount}`,
        txHash: gaslessResult.txHash,
      });
      refreshTransactions();
    } catch (err: unknown) {
      setTxState({ phase: "error", message: err instanceof Error ? err.message : "Swap failed" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-3xl bg-[#13121C] border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col relative"
      >
        <TransactionOverlay 
          state={txState} 
          onDone={() => { resetModal(); onClose(); refetchBalance(); }} 
          onRetry={() => setTxState({ phase: "idle" })}
          onClose={() => { resetModal(); onClose(); }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2 text-white/70">
            <div className="p-1.5 rounded-md bg-white/[0.05]">
              <Zap className="w-4 h-4 text-neon-orange" />
            </div>
            <span className="text-sm font-medium">Crypto to Mobile Money</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.05] transition-colors text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh]">
          <h2 className="text-lg sm:text-xl font-bold text-white text-center mb-5 sm:mb-6">Swap to Cash</h2>

          <div className="space-y-4 sm:space-y-5">
            {/* Account Input */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">Phone number / Account Number</label>
              <input
                type="text"
                placeholder="e.g. 0712345678"
                value={phoneOrAccount}
                onChange={e => setPhoneOrAccount(e.target.value)}
                className="w-full bg-[#1A1924] border border-white/[0.05] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-neon-orange/50 transition-colors"
              />
            </div>

            {/* Responsive Swap Box */}
            <div className="bg-[#1A1924] border border-white/[0.05] rounded-2xl p-3 sm:p-4">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-white/40 mb-3 px-1">
                <span>1 USDC = KES {rate}</span>
                <span className="bg-white/[0.05] px-2 py-1 rounded-full text-white/60">
                  KES {fee.toFixed(2)} fee
                </span>
              </div>

              {/* Stack vertically on mobile, horizontally on sm+ */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 relative">

                {/* Crypto Input */}
                <div className="flex-1 w-full bg-[#13121C] rounded-xl p-3 border border-neon-orange/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-white/50">Crypto</span>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-white">
                      <USDCIcon className="w-3.5 h-3.5" /> USDC <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={cryptoAmount}
                      onChange={e => setCryptoAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-lg sm:text-xl font-bold text-white outline-none min-w-0"
                    />
                    <button
                      onClick={() => setCryptoAmount(usdcBalance > 0 ? usdcBalance.toString() : "0")}
                      className="text-[10px] font-bold text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-md"
                    >
                      Max
                    </button>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">Balance: {usdcBalance.toFixed(4)} USDC</div>
                </div>

                {/* Swap Icon */}
                <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-[#252433] border border-white/[0.05]">
                  <ArrowRightLeft className="w-3 h-3 text-white/50" />
                </div>
                {/* Mobile Swap Icon */}
                <div className="sm:hidden self-center p-1.5 rounded-lg bg-[#252433] border border-white/[0.05] z-10 -my-4 relative">
                  <ArrowRightLeft className="w-3 h-3 text-white/50 rotate-90" />
                </div>

                {/* Cash Output */}
                <div className="flex-1 w-full bg-[#13121C] rounded-xl p-3 border border-transparent">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-white/50">Cash</span>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-white">
                      KES
                    </div>
                  </div>
                  <div className="w-full bg-transparent text-lg sm:text-xl font-bold text-white py-[2px] truncate">
                    {cashAmount}
                  </div>
                </div>

              </div>
            </div>

            {/* Payment Reason */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">Payment reason (optional)</label>
              <input
                type="text"
                placeholder="Payment reference"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-[#1A1924] border border-white/[0.05] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-neon-orange/50 transition-colors"
              />
            </div>

            <button
              onClick={handleSwap}
              disabled={isSwapping || !cryptoAmount}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-neon-orange hover:bg-neon-amber text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 text-sm sm:text-base"
            >
              {isSwapping ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Payment"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
