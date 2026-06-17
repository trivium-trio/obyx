// ═══════════════════════════════════════
// OBYX Mock Data
// ═══════════════════════════════════════

export interface Currency {
  code: string;
  name: string;
  flag: string;
  symbol: string;
}

export interface Token {
  symbol: string;
  name: string;
  icon: string;
  color: string;
}

export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
}

export interface Transaction {
  id: string;
  timestamp: string;
  pair: string;
  amount: string;
  value: string;
  status: "completed" | "pending" | "failed";
  type: "buy" | "sell";
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

// ── Fiat Currencies ──
export const currencies: Currency[] = [
  { code: "KSH", name: "Kenyan Shilling", flag: "🇰🇪", symbol: "KSh" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦", symbol: "R" },
];

// ── Crypto Tokens ──
export const tokens: Token[] = [
  { symbol: "USDC", name: "USD Coin", icon: "💎", color: "#2775CA" },
  { symbol: "USDT", name: "Tether", icon: "💚", color: "#26A17B" },
  { symbol: "DAI", name: "Dai", icon: "🟡", color: "#F5AC37" },
  { symbol: "ETH", name: "Ethereum", icon: "⟠", color: "#627EEA" },
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "#F7931A" },
];

// ── Conversion Rates (per 1 unit of crypto) ──
export const conversionRates: Record<string, Record<string, number>> = {
  USDC: { KSH: 129.50, USD: 1.00, EUR: 0.92, GBP: 0.79, NGN: 1580.00, ZAR: 18.20 },
  USDT: { KSH: 129.45, USD: 1.00, EUR: 0.92, GBP: 0.79, NGN: 1579.50, ZAR: 18.19 },
  DAI:  { KSH: 129.48, USD: 1.00, EUR: 0.92, GBP: 0.79, NGN: 1579.80, ZAR: 18.20 },
  ETH:  { KSH: 485250.00, USD: 3750.00, EUR: 3450.00, GBP: 2962.50, NGN: 5925000.00, ZAR: 68250.00 },
  BTC:  { KSH: 8862500.00, USD: 68500.00, EUR: 63020.00, GBP: 54115.00, NGN: 108220000.00, ZAR: 1246700.00 },
};

// ── Mock Transactions ──
export const mockTransactions: Transaction[] = [
  { id: "tx_001", timestamp: "13:27:04", pair: "KSH/USDC", amount: "50,000 KSH", value: "385.91 USDC", status: "completed", type: "buy" },
  { id: "tx_002", timestamp: "13:26:58", pair: "KSH/USDT", amount: "12,000 KSH", value: "92.66 USDT", status: "completed", type: "buy" },
  { id: "tx_003", timestamp: "13:26:45", pair: "USD/ETH", amount: "5,000 USD", value: "1.333 ETH", status: "pending", type: "buy" },
  { id: "tx_004", timestamp: "13:26:31", pair: "KSH/USDC", amount: "200,000 KSH", value: "1,544.40 USDC", status: "completed", type: "buy" },
  { id: "tx_005", timestamp: "13:26:22", pair: "NGN/USDC", amount: "500,000 NGN", value: "316.45 USDC", status: "failed", type: "buy" },
  { id: "tx_006", timestamp: "13:26:15", pair: "KSH/DAI", amount: "75,000 KSH", value: "579.34 DAI", status: "completed", type: "sell" },
  { id: "tx_007", timestamp: "13:26:02", pair: "EUR/USDC", amount: "2,500 EUR", value: "2,717.39 USDC", status: "completed", type: "buy" },
  { id: "tx_008", timestamp: "13:25:48", pair: "KSH/BTC", amount: "1,000,000 KSH", value: "0.01128 BTC", status: "pending", type: "buy" },
  { id: "tx_009", timestamp: "13:25:33", pair: "GBP/ETH", amount: "10,000 GBP", value: "3.375 ETH", status: "completed", type: "buy" },
  { id: "tx_010", timestamp: "13:25:19", pair: "KSH/USDC", amount: "25,000 KSH", value: "193.05 USDC", status: "completed", type: "sell" },
];

// ── Order Book Mock ──
export const mockBids: OrderBookEntry[] = [
  { price: 129.50, amount: 2450.00, total: 317275.00 },
  { price: 129.48, amount: 1800.00, total: 233064.00 },
  { price: 129.45, amount: 3200.00, total: 414240.00 },
  { price: 129.42, amount: 900.00, total: 116478.00 },
  { price: 129.40, amount: 5100.00, total: 659940.00 },
  { price: 129.38, amount: 1200.00, total: 155256.00 },
  { price: 129.35, amount: 4300.00, total: 556205.00 },
  { price: 129.30, amount: 2100.00, total: 271530.00 },
];

export const mockAsks: OrderBookEntry[] = [
  { price: 129.52, amount: 1900.00, total: 246088.00 },
  { price: 129.55, amount: 3100.00, total: 401605.00 },
  { price: 129.58, amount: 800.00, total: 103664.00 },
  { price: 129.60, amount: 4500.00, total: 583200.00 },
  { price: 129.65, amount: 2200.00, total: 285230.00 },
  { price: 129.68, amount: 1600.00, total: 207488.00 },
  { price: 129.72, amount: 3800.00, total: 492936.00 },
  { price: 129.78, amount: 2800.00, total: 363384.00 },
];

// ── Status card data for dashboard ──
export const statusCards = [
  {
    title: "MARKET MOOD",
    value: "FOMO LEVEL 9000",
    subtitle: "Greed index at maximum overdrive",
    icon: "🔥",
    accent: "#FF6B00",
    progress: 92,
  },
  {
    title: "DREAM STATUS",
    value: "CRASHED",
    subtitle: "File missing. Rebooting optimism...",
    icon: "💀",
    accent: "#FF3B5C",
    progress: 15,
  },
  {
    title: "⚠️ ADVISORY",
    value: "VOLATILE TOKEN",
    subtitle: "Parental guidance recommended",
    icon: "⚠️",
    accent: "#FFB800",
    progress: 78,
  },
  {
    title: "GAS FEE STATUS",
    value: "PAIN",
    subtitle: "Your wallet is crying rn",
    icon: "⛽",
    accent: "#FF9F00",
    progress: 88,
  },
];
