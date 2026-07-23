import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";

/**
 * Wagmi config for read-only RPC calls (e.g., token balance queries).
 * Dynamic Labs continues to handle wallet connection/signing.
 * We only use Wagmi here to bypass Dynamic's broken token indexing API.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});
