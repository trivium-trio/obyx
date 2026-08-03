import { useReadContract } from "wagmi";
import { useWallet } from "@/lib/WalletContext";

// USDC contract on Base Sepolia (Circle official)
const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

// Minimal ERC-20 ABI — only the balanceOf function we need
const ERC20_BALANCE_ABI = [
  {
    type: "function" as const,
    name: "balanceOf",
    stateMutability: "view" as const,
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Helper to get active wallet spendable USDC balance via direct RPC.
// Bypasses Dynamic's internal token indexing API which returns 422 on Base Sepolia.
export function useActiveUsdcBalance(): { balance: number; isLoading: boolean; refetch: () => void } {
  const { activeWalletAddress } = useWallet();
  const { data, isLoading, refetch } = useReadContract({
    address: BASE_SEPOLIA_USDC,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: activeWalletAddress ? [activeWalletAddress as `0x${string}`] : undefined,
    chainId: 84532,
    query: {
      enabled: !!activeWalletAddress,
    },
  });
  // USDC has 6 decimals
  const balance = data ? Number(data) / 1e6 : 0;
  return { balance, isLoading, refetch };
}
