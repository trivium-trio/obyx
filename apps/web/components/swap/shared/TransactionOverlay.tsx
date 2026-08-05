import React from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export type TxOverlayState =
  | { phase: "idle" }
  | { phase: "executing"; message: string }
  | { phase: "success"; summary: string; txHash?: string; resultMsg?: string }
  | { phase: "error"; message: string };

export function TransactionOverlay({
  state,
  onDone,
  onRetry,
  onClose,
}: {
  state: TxOverlayState;
  onDone: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (state.phase === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#13121C]/95 backdrop-blur-md p-6 rounded-[24px] sm:rounded-3xl"
    >
      {state.phase === "executing" && (
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-16 h-16 text-neon-orange animate-spin mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Executing...</h3>
          <p className="text-sm text-white/60 max-w-[250px]">{state.message}</p>
          <div className="mt-8 text-xs text-white/40 bg-white/[0.05] px-4 py-2 rounded-lg border border-white/[0.05]">
            Please do not close this window
          </div>
        </div>
      )}

      {state.phase === "success" && (
        <div className="flex flex-col items-center text-center w-full">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <CheckCircle2 className="w-20 h-20 text-success mb-6" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
          <p className="text-sm font-medium text-white/80 mb-2">{state.summary}</p>
          {state.resultMsg && <p className="text-xs text-success/80 mb-6 bg-success/10 px-3 py-1.5 rounded-lg">{state.resultMsg}</p>}
          {!state.resultMsg && <div className="mb-6" />}
          
          {state.txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${state.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-info hover:text-info/80 transition-colors mb-8 bg-info/10 px-3 py-1.5 rounded-full"
            >
              Tx: {state.txHash.slice(0, 8)}...{state.txHash.slice(-6)}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          <button
            onClick={onDone}
            className="w-full max-w-[200px] py-3.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-bold transition-colors border border-white/[0.1]"
          >
            Done
          </button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="flex flex-col items-center text-center w-full">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <XCircle className="w-20 h-20 text-danger mb-6" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">Transaction Failed</h3>
          <p className="text-sm text-danger/80 mb-8 max-w-[250px] break-words">{state.message}</p>
          
          <div className="flex gap-3 w-full max-w-[250px]">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-bold transition-colors border border-white/[0.1]"
            >
              Close
            </button>
            <button
              onClick={onRetry}
              className="flex-1 py-3.5 rounded-xl bg-neon-orange hover:bg-neon-amber text-white font-bold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
