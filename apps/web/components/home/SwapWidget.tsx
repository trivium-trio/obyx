"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ChevronDown,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  AlertTriangle,
  Wallet,
  Zap,
  ChevronUp,
  Scan,
  Send,
  Download,
  Copy,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { conversionRates } from "@/lib/mock-data";
import { useWallet } from "@/lib/WalletContext";
import { useDynamicContext, useTokenBalances } from "@dynamic-labs/sdk-react-core";
import { OnrampService, OfframpService } from "@/lib/api/client";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";

// Helper to get active wallet spendable USDC balance
function useActiveUsdcBalance() {
  const { activeWalletAddress } = useWallet();
  const { tokenBalances } = useTokenBalances({ 
    accountAddress: activeWalletAddress || undefined,
    networkId: 84532,
  });
  return useMemo(() => {
    if (!tokenBalances || !Array.isArray(tokenBalances)) return 0;
    const usdcToken = tokenBalances.find(t => t.symbol?.toUpperCase() === 'USDC' || t.name?.toUpperCase().includes('USDC'));
    return usdcToken?.balance ?? 0;
  }, [tokenBalances]);
}

// ════════════════════════════════════════════════════════
// EXACT SVG ICONS
// ════════════════════════════════════════════════════════

const USDCIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g fill="none">
      <circle fill="#2775CA" cx="16" cy="16" r="16"/>
      <g fill="#FFF">
        <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.243-2.193-.728-2.193-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 00.427.303h.975a.416.416 0 00.427-.425v-.06a3.04 3.04 0 00-2.743-2.489V9.142c0-.243-.183-.425-.487-.486h-.915c-.243 0-.426.182-.487.486v1.396c-1.829.242-2.986 1.456-2.986 2.974 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036a.416.416 0 00-.426.425v.06c.243 1.518 1.219 2.61 3.23 2.914v1.457c0 .242.183.425.487.485h.915c.243 0 .426-.182.487-.485V21.34c1.829-.303 3.047-1.578 3.047-3.217z"/>
        <path d="M12.892 24.497c-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85c0-.242-.121-.424-.365-.485-.061 0-.183 0-.244.06a10.895 10.895 0 00-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85c0-.182-.182-.424-.365-.546zm6.46-18.936c-.244-.122-.488 0-.548.242-.061.061-.061.122-.061.243v.85c0 .243.182.485.365.607 4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85c0 .242.121.424.365.485.061 0 .183 0 .244-.06a10.895 10.895 0 007.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162z"/>
      </g>
    </g>
  </svg>
);

const USDTIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g fill="none" fillRule="evenodd">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
    </g>
  </svg>
);

const WXMIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <path d="M9 13L13 21L16 16L19 21L23 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ════════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════════

function SwapToCashModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { circleAddress, sendGaslessSwap, isConnected, activeWallet } = useWallet();
  const { refreshTransactions } = useTransactionHistory();
  const { setShowAuthFlow } = useDynamicContext();
  const usdcBalance = useActiveUsdcBalance();

  const [cryptoAmount, setCryptoAmount] = useState("");
  const [phoneOrAccount, setPhoneOrAccount] = useState("");
  const [reason, setReason] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }
    if (activeWallet === "external") {
      setError("Off-ramp from external wallets requires sending on-chain tx. Please switch to your embedded OBYX Wallet for gasless off-ramp.");
      return;
    }
    if (!circleAddress) return;

    setIsSwapping(true);
    setError(null);
    try {
      const usdcAmt = parseFloat(cryptoAmount);
      if (!usdcAmt || usdcAmt <= 0) throw new Error("Enter a valid amount");

      const res = await OfframpService.postOfframpInit({ usdcAmount: usdcAmt });
      const gaslessResult = await sendGaslessSwap(circleAddress, usdcAmt);
      
      await OfframpService.postOfframpConfirm({
        transactionId: res.data!.transactionId as string,
        txHash: gaslessResult.txHash,
      });

      setResult(gaslessResult);
      refreshTransactions();
    } catch (err: any) {
      setError(err.message || "Swap failed");
    } finally {
      setIsSwapping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-3xl bg-[#13121C] border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col"
      >
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

            {/* Error & Result */}
            {error && (
              <div className="text-xs text-danger flex items-center gap-2 p-3 bg-danger/10 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {result && (
              <div className="text-xs text-success flex items-center gap-2 p-3 bg-success/10 rounded-xl">
                Swap successful! Tx: {result.txHash?.slice(0,8)}...
              </div>
            )}

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

function SwapToCryptoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userPhone, setUserPhone, isConnected, activeWallet, activeWalletAddress, circleAddress } = useWallet();
  const { refreshTransactions } = useTransactionHistory();
  const { setShowAuthFlow } = useDynamicContext();
  const usdcBalance = useActiveUsdcBalance();

  const [cashAmount, setCashAmount] = useState("");
  const [phone, setPhone] = useState(userPhone || "+254");
  const [reason, setReason] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }
    if (activeWallet === "embedded" && !circleAddress) return;
    if (activeWallet === "external" && !activeWalletAddress) return;
    setIsSwapping(true);
    setError(null);
    try {
      const fiatAmt = parseFloat(cashAmount);
      if (!fiatAmt || fiatAmt <= 0) throw new Error("Enter a valid amount");

      const res = await OnrampService.postOnrampInit({
        fiatAmount: fiatAmt,
        phoneNumber: phone,
        walletAddress: activeWalletAddress || undefined,
      } as any);

      setResult({ msg: "Prompt sent! Check your phone." });
      refreshTransactions();
      if (!userPhone) setUserPhone(phone);
    } catch (err: any) {
      setError(err.message || "Swap failed");
    } finally {
      setIsSwapping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[440px] rounded-[24px] sm:rounded-3xl bg-[#13121C] border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col"
      >
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

            {/* Error & Result */}
            {error && (
              <div className="text-xs text-danger flex items-center gap-2 p-3 bg-danger/10 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {result && (
              <div className="text-xs text-success flex items-center gap-2 p-3 bg-success/10 rounded-xl">
                {result.msg}
              </div>
            )}

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

function WalletTransferModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sendGaslessSwap, isConnected, activeWallet, activeWalletAddress, circleAddress } = useWallet();
  const { refreshTransactions } = useTransactionHistory();
  const { setShowAuthFlow } = useDynamicContext();
  const usdcBalance = useActiveUsdcBalance();

  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [recipient, setRecipient] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const rate = conversionRates["USDC"]?.["KSH"] || 129.50;

  const cashAmount = useMemo(() => {
    const amt = parseFloat(cryptoAmount) || 0;
    const calc = amt * rate;
    return calc > 0 ? calc.toFixed(2) : "0.00";
  }, [cryptoAmount, rate]);

  const handleSend = async () => {
    if (!isConnected) {
      setShowAuthFlow(true);
      return;
    }
    if (activeWallet === "external") {
      setError("Gasless peer-to-peer transfers are currently supported on embedded wallets only.");
      return;
    }
    if (activeWallet === "embedded" && !circleAddress) return;
    if (!recipient) {
      setError("Please enter a valid recipient address");
      return;
    }
    setIsSwapping(true);
    setError(null);
    try {
      const usdcAmt = parseFloat(cryptoAmount);
      if (!usdcAmt || usdcAmt <= 0) throw new Error("Enter a valid amount");

      // Gasless transfer to the specified recipient
      const gaslessResult = await sendGaslessSwap(recipient, usdcAmt);

      setResult(gaslessResult);
      refreshTransactions();
    } catch (err: any) {
      setError(err.message || "Transfer failed");
    } finally {
      setIsSwapping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-[480px] rounded-[24px] sm:rounded-3xl bg-[#13121C] border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col"
      >
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

                {/* Error & Result */}
                {error && (
                  <div className="text-xs text-danger flex items-center gap-2 p-3 bg-danger/10 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
                {result && (
                  <div className="text-xs text-success flex items-center gap-2 p-3 bg-success/10 rounded-xl">
                    Transfer successful! Tx: {result.txHash?.slice(0,8)}...
                  </div>
                )}

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
  const [activeModal, setActiveModal] = useState<"cash"|"crypto"|"transfer"|null>(null);
  const usdcBalance = useActiveUsdcBalance();
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
                {showBalance ? (usdcBalance * rate).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••"}
              </span>
            </div>
            <span className="text-sm text-white/40 font-mono mt-1">
              {showBalance ? `${usdcBalance.toFixed(6)} USDC` : "•••••••• USDC"}
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
