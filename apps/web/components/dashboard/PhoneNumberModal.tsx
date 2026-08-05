"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phoneNumber: string) => void;
}

export function PhoneNumberModal({ isOpen, onClose, onSuccess }: PhoneNumberModalProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanPhone = phoneInput.trim().replace(/\s+/g, "");
    if (cleanPhone.startsWith("07") || cleanPhone.startsWith("01")) {
      cleanPhone = "+254" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("254") && cleanPhone.length === 12) {
      cleanPhone = '+' + cleanPhone;
    } else if (cleanPhone.startsWith("7") || cleanPhone.startsWith("1")) {
      if (cleanPhone.length === 9) {
        cleanPhone = "+254" + cleanPhone;
      }
    }

    const kenyaPhoneRegex = /^\+254(7|1)\d{8}$/;
    if (!kenyaPhoneRegex.test(cleanPhone)) {
      setError("Please enter a valid M-Pesa mobile number (e.g., 0712 345 678 or +254712345678).");
      return;
    }

    setIsSubmitting(true);
    try {
      onSuccess(cleanPhone);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save phone number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          className="relative z-10 w-full max-w-md rounded-3xl glass-card border border-white/[0.1] p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Ambient neon glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-neon-orange/20 blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neon-orange/15 border border-neon-orange/30 text-neon-orange">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  M-Pesa Phone Number
                </h3>
                <p className="text-xs text-white/40 font-mono">
                  REQUIRED FOR STK PUSH
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
                Mobile Money Number (Safaricom M-Pesa)
              </label>
              <div className="flex items-center rounded-2xl bg-white/[0.04] border border-white/[0.1] focus-within:border-neon-orange/50 transition-colors p-1.5">
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.06] text-xs font-mono text-white/70">
                  <span className="text-base">🇰🇪</span>
                  <span>+254</span>
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 bg-transparent px-3 py-2 text-base font-mono text-white placeholder:text-white/20 outline-none"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-white/35 mt-2 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-success inline" />
                Paystack will send an STK push prompt to this phone.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3 text-xs text-danger"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit CTA */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={cn(
                "w-full rounded-2xl py-4 text-sm font-semibold transition-all duration-300",
                "bg-gradient-to-r from-neon-orange to-neon-amber text-white",
                "hover:shadow-[0_0_25px_rgba(255,107,0,0.35)]",
                "disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving & Initiating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save & Continue Swap</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
