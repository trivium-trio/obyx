import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRightLeft, X, Wallet, Loader2, Send, Download, Scan, QrCode, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { conversionRates } from "@/lib/mock-data";
import { useWallet } from "@/lib/WalletContext";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { USDCIcon } from "../shared/icons";
import { TransactionOverlay, TxOverlayState } from "../shared/TransactionOverlay";
import { useActiveUsdcBalance } from "@/lib/hooks/useActiveUsdcBalance";

export default function WalletTransferModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sendGaslessSwap, isConnected, activeWallet, activeWalletAddress, circleAddress } = useWallet();
  const { refreshTransactions } = useTransactionHistory();
  const { setShowAuthFlow } = useDynamicContext();
  const { balance: usdcBalance, refetch: refetchBalance } = useActiveUsdcBalance();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [recipient, setRecipient] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [txState, setTxState] = useState<TxOverlayState>({ phase: "idle" });

  const resetModal = () => {
    setTxState({ phase: "idle" });
    setRecipient("");
    setCryptoAmount("");
  };

  const isSwapping = txState.phase !== "idle";

  const rate = conversionRates["USDC"]?.["KSH"] || 129.50;

  const cashAmount = useMemo(() => {
    const amt = parseFloat(cryptoAmount) || 0;
    const calc = amt * rate;
    return calc > 0 ? calc.toFixed(2) : "0.00";
  }, [cryptoAmount, rate]);

  const handleSend = async () => {
    if (!user) {
      router.push("/auth/signup");
      return;
    }
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }
    if (activeWallet === "external") {
      setTxState({ phase: "error", message: "Gasless peer-to-peer transfers are currently supported on embedded wallets only." });
      return;
    }
    if (activeWallet === "embedded" && !circleAddress) return;
    if (!recipient) {
      setTxState({ phase: "error", message: "Please enter a valid recipient address" });
      return;
    }
    setTxState({ phase: "executing", message: `Transferring ${cryptoAmount} USDC...` });
    try {
      const usdcAmt = parseFloat(cryptoAmount);
      if (!usdcAmt || usdcAmt <= 0) throw new Error("Enter a valid amount");

      // Gasless transfer to the specified recipient
      const gaslessResult = await sendGaslessSwap(recipient, usdcAmt);

      setTxState({
        phase: "success",
        summary: `Sent ${usdcAmt.toFixed(2)} USDC`,
        txHash: gaslessResult.txHash,
      });
      refreshTransactions();
    } catch (err: any) {
      setTxState({ phase: "error", message: err.message || "Transfer failed" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[480px] rounded-[24px] sm:rounded-3xl bg-[#13121C] border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col relative"
      >
        <TransactionOverlay 
          state={txState} 
          onDone={() => { resetModal(); onClose(); refetchBalance(); }} 
          onRetry={() => setTxState({ phase: "idle" })}
          onClose={() => { resetModal(); onClose(); }}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2.5 rounded-xl bg-[#252433] border border-white/[0.05]">
              <ArrowRightLeft className="w-5 h-5 text-neon-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Wallet Transfer</h2>
              <span className="text-xs text-white/40">Peer-to-peer</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Wallet ready
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.05] transition-colors text-white/40">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] pt-0">

          {/* Tabs */}
          <div className="flex bg-[#1A1924] p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("send")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                activeTab === "send" ? "bg-[#252433] text-white shadow-sm" : "text-white/40 hover:text-white"
              )}
            >
              <Send className="w-4 h-4" /> Send
            </button>
            <button
              onClick={() => setActiveTab("receive")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                activeTab === "receive" ? "bg-[#252433] text-white shadow-sm" : "text-white/40 hover:text-white"
              )}
            >
              <Download className="w-4 h-4" /> Receive
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "send" ? (
              <motion.div
                key="send"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Recipient Input */}
                <div>
                  <label className="text-xs text-white/50 mb-2 block">Recipient</label>
                  <div className="flex items-center gap-2 bg-[#1A1924] border border-white/[0.05] rounded-xl px-4 py-3 focus-within:border-neon-orange/50 transition-colors">
                    <Wallet className="w-4 h-4 text-white/30 shrink-0" />
                    <input
                      type="text"
                      placeholder="0x... or name.eth"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none font-semibold text-sm placeholder:text-white/20 min-w-0"
                    />
                    <Scan className="w-4 h-4 text-white/30 shrink-0 cursor-pointer hover:text-white/70" />
                  </div>
                </div>

                {/* Responsive Swap Box */}
                <div className="bg-[#1A1924] border border-white/[0.05] rounded-2xl p-3 sm:p-4">
                  <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-white/40 mb-3 px-1">
                    <span className="bg-[#13121C] px-3 py-1.5 rounded-full border border-white/[0.05]">1 USDC ≈ KES {rate}</span>
                    <span className="bg-[#13121C] px-3 py-1.5 rounded-full border border-white/[0.05]">No platform fee</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 relative">

                    {/* Crypto Input */}
                    <div className="flex-1 w-full bg-[#13121C] rounded-xl p-4 border border-white/[0.05] focus-within:border-neon-orange/50 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-white/50 font-medium">Crypto</span>
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
                          <USDCIcon className="w-4 h-4" /> USDC <ChevronDown className="w-3 h-3 text-white/40" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={cryptoAmount}
                          onChange={e => setCryptoAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent text-2xl font-bold text-white outline-none min-w-0"
                        />
                        <button
                          onClick={() => setCryptoAmount(usdcBalance > 0 ? usdcBalance.toString() : "0")}
                          className="text-[10px] font-bold text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-md"
                        >
                          Max
                        </button>
                      </div>
                      <div className="text-[10px] text-white/30 mt-2">Balance: {usdcBalance.toFixed(4)} USDC</div>
                    </div>

                    {/* Swap Icon */}
                    <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-[#252433] border border-white/[0.05]">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <div className="sm:hidden self-center p-2 rounded-xl bg-[#252433] border border-white/[0.05] z-10 -my-4 relative">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-white/40 rotate-90" />
                    </div>

                    {/* Cash Output */}
                    <div className="flex-1 w-full bg-[#13121C] rounded-xl p-4 border border-transparent">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-white/50 font-medium">Cash</span>
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-white">
                          KES
                        </div>
                      </div>
                      <div className="w-full bg-transparent text-2xl font-bold text-white py-[2px] truncate">
                        {cashAmount || "0"}
                      </div>
                    </div>

                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={isSwapping || !cryptoAmount || !recipient}
                  className="w-full mt-2 py-4 rounded-xl bg-[#615CE8] hover:bg-[#524DCC] text-white font-bold transition-colors flex items-center justify-center disabled:opacity-50 text-base"
                >
                  {isSwapping ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send USDC"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="receive"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col items-center py-6"
              >
                <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {/* QR Code */}
                  <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    {isConnected && activeWalletAddress ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${activeWalletAddress}&color=13121c`}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#13121C]/40">
                        <QrCode className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-xs font-mono font-bold">CONNECT WALLET</span>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-white font-bold text-lg mb-2">Your Receive Address</h3>
                <p className="text-white/40 text-xs text-center px-6 mb-6">
                  Only send USDC on the Base network to this address. Sending other tokens may result in permanent loss.
                </p>

                <div className="w-full bg-[#1A1924] border border-white/[0.05] rounded-xl p-1 flex items-center">
                  <div className="flex-1 px-3 py-2 text-sm text-white/70 font-mono truncate select-all">
                    {isConnected ? (activeWalletAddress || "0x0000...0000") : "Connect wallet to receive"}
                  </div>
                  <button
                    onClick={() => activeWalletAddress && navigator.clipboard.writeText(activeWalletAddress)}
                    className="p-3 bg-[#252433] hover:bg-white/[0.08] rounded-lg transition-colors text-white"
                    title="Copy address"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
