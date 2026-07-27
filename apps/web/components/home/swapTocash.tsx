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
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useReadContract } from "wagmi";
import { OnrampService, OfframpService } from "@/lib/api/client";
import { useTransactionHistory } from "@/lib/TransactionHistoryContext";




