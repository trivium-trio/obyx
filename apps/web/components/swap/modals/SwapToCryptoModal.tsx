import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ArrowRightLeft, X, Wallet, Loader2 } from "lucide-react";
import { conversionRates } from "@/lib/mock-data";
import { useWallet } from "@/lib/WalletContext";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { OnrampService } from "@/lib/api/client";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { USDCIcon } from "../shared/icons";
import { TransactionOverlay, TxOverlayState } from "../shared/TransactionOverlay";
import { useActiveUsdcBalance } from "@/lib/hooks/useActiveUsdcBalance";

export default function SwapToCryptoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userPhone, setUserPhone, isConnected, activeWallet, activeWalletAddress, circleAddress } = useWallet();
  const { refreshTransactions } = useTransactionHistory();
  const { setShowAuthFlow } = useDynamicContext();
  const { balance: usdcBalance, refetch: refetchBalance } = useActiveUsdcBalance();
  const { user } = useAuth();
  const router = useRouter();

  const [cashAmount, setCashAmount] = useState("");
  const [phone, setPhone] = useState(userPhone || "+254");
  const [reason, setReason] = useState("");
  const [txState, setTxState] = useState<TxOverlayState>({ phase: "idle" });

  const resetModal = () => {
    setTxState({ phase: "idle" });
    setCashAmount("");
    setReason("");
  };

  const isSwapping = txState.phase !== "idle";

  const rate = conversionRates["USDC"]?.["KSH"] || 129.50;

  const fee = useMemo(() => {
    const amt = parseFloat(cashAmount) || 0;
    return amt * 0.005;
  }, [cashAmount]);

  const cryptoAmount = useMemo(() => {
    const amt = parseFloat(cashAmount) || 0;
    const amountAfterFee = Math.max(0, amt - fee);
    const calc = amountAfterFee / rate;
    return calc > 0 ? calc.toFixed(6) : "0.000000";
  }, [cashAmount, rate, fee]);

  const handleSwap = async () => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }
    if (activeWallet === "embedded" && !circleAddress) return;
    if (activeWallet === "external" && !activeWalletAddress) return;

    setTxState({ phase: "executing", message: `Initiating STK push for KES ${cashAmount}...` });
    try {
      const fiatAmt = parseFloat(cashAmount);
      if (!fiatAmt || fiatAmt <= 0) throw new Error("Enter a valid amount");

      await OnrampService.postOnrampInit({
        fiatAmount: fiatAmt,
        phoneNumber: phone,
        walletAddress: activeWalletAddress || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      setTxState({
        phase: "success",
        summary: `KES ${cashAmount} → ${cryptoAmount} USDC`,
        resultMsg: "Check your phone to complete the payment."
      });
      refreshTransactions();
      if (!userPhone) setUserPhone(phone);
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
              <Wallet className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm font-medium">Mobile Money to Crypto</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.05] transition-colors text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh]">
          <h2 className="text-lg sm:text-xl font-bold text-white text-center mb-5 sm:mb-6">Swap to Crypto</h2>

          <div className="space-y-4 sm:space-y-5">
            {/* Phone Input */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">M-Pesa phone number</label>
              <div className="flex items-center gap-2.5 bg-[#1A1924] border border-success/30 rounded-xl px-4 py-3">
                <span className="shrink-0 text-base" title="Kenya">🇰🇪</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full min-w-0 bg-transparent text-white focus:outline-none font-semibold text-sm placeholder:text-white/20"
                  placeholder="+254712345678"
                />
              </div>
              <p className="text-[10px] text-white/30 mt-2">You will receive an M-Pesa STK push on this number</p>
            </div>

            {/* Responsive Swap Box */}
            <div className="bg-[#1A1924] border border-white/[0.05] rounded-2xl p-3 sm:p-4">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-white/40 mb-3 px-1">
                <span>1 USDC = KES {rate}</span>
                <span className="bg-white/[0.05] px-2 py-1 rounded-full text-white/60">
                  KES {fee.toFixed(2)} fee
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 relative">

                {/* Crypto Output */}
                <div className="flex-1 w-full bg-[#13121C] rounded-xl p-3 border border-transparent">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-white/50">Crypto</span>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-white">
                      <USDCIcon className="w-3.5 h-3.5" /> USDC <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="w-full bg-transparent text-lg sm:text-xl font-bold text-white py-[2px] truncate">
                    {cryptoAmount}
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">Balance: {usdcBalance.toFixed(4)} USDC</div>
                </div>

                {/* Swap Icon */}
                <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-[#252433] border border-white/[0.05]">
                  <ArrowRightLeft className="w-3 h-3 text-white/50" />
                </div>
                <div className="sm:hidden self-center p-1.5 rounded-lg bg-[#252433] border border-white/[0.05] z-10 -my-4 relative">
                  <ArrowRightLeft className="w-3 h-3 text-white/50 rotate-90" />
                </div>

                {/* Cash Input */}
                <div className="flex-1 w-full bg-[#13121C] rounded-xl p-3 border border-success/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-white/50">Cash</span>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-white">
                      KES
                    </div>
                  </div>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-lg sm:text-xl font-bold text-white outline-none min-w-0"
                  />
                </div>

              </div>
            </div>

            {/* Payment Reason */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">Payment reason (optional)</label>
              <input
                type="text"
                placeholder="Transport"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-[#1A1924] border border-white/[0.05] rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-success/50 transition-colors"
              />
            </div>

            <button
              onClick={handleSwap}
              disabled={isSwapping || !cashAmount}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-success hover:bg-emerald-500 text-[#0A1A14] font-bold transition-colors flex items-center justify-center disabled:opacity-50 text-sm sm:text-base"
            >
              {isSwapping ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Deposit"}
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
