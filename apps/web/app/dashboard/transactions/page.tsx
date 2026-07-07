"use client";

import { motion } from "framer-motion";
import { TransactionStream } from "@/components/dashboard/TransactionStream";
import { OrderBook } from "@/components/dashboard/OrderBook";

export default function TransactionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Transactions
        </h1>
        <p className="text-sm text-white/35 font-mono">
          Live transaction feed and order book
        </p>
      </motion.div>

      {/* Main grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Transaction Stream - 2 cols */}
        <div className="lg:col-span-2">
          <TransactionStream />
        </div>

        {/* Order Book - 1 col */}
        <div className="lg:col-span-1">
          <OrderBook />
        </div>
      </motion.div>
    </div>
  );
}
