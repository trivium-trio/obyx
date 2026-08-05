# Architecture Specification 01: Onramp Pipeline, Auth-Gated Wallet Provisioning & Seamless Dynamic UX

**Document ID**: `ARCH-SPEC-01`  
**Status**: Approved for Engineering Implementation  
**Target Subsystems**: Frontend Wallet Providers, UI Widgets, and Backend Onramp API Routing  
**Primary Objective**: Eliminate onboarding UX friction, enforce strict Supabase authentication prior to wallet connection, implement explicit (lazy) Circle Smart Account (SCA) provisioning, and guarantee dynamic backend address resolution during Onramp STK push disbursements.

---

## 1. Executive Summary & Architectural Motivation

### 1.1 Problem Statement
The current platform implementation exhibits four core architectural discrepancies:
1. **Redundant Onboarding Friction**: Users register via Supabase (Email/Password), yet upon initiating wallet connection, the Dynamic SDK prompts them for an email verification again.
2. **Unauthenticated Wallet Connectivity**: Unauthenticated site visitors can invoke wallet connection flows and generate external or embedded wallets without an active Supabase user session.
3. **Eager SCA Provisioning**: `WalletContext` automatically initializes a Circle Smart Account (SCA) on Base Sepolia immediately upon EOA connection, deploying counterfactual addresses before the user requests an embedded wallet.
4. **Static Address Resolution**: During Onramp initiation, the backend defaults to static database values (`user.walletAddress`) unless explicitly overridden. If an EOA address is stored in the database while the user is actively viewing an embedded Smart Account in the UI, disbursed funds land in the EOA while the active UI reports a `0.00` balance.

### 1.2 Target Architecture
```mermaid
sequenceDiagram
    autonumber
    participant User as User / UI
    participant Auth as Supabase Auth
    participant Dyn as Dynamic SDK (EOA)
    participant WC as WalletContext (Circle SCA)
    participant API as Backend API (/onramp/init)
    participant DB as Supabase DB

    User->>Auth: 1. Login with Email / Password
    Auth-->>User: Active Session & User Profile
    User->>Dyn: 2. Click "Connect Wallet" (Auth-gated!)
    Note over Dyn: JWT profile synced -> Zero email prompt!
    Dyn-->>User: EOA Connected (MetaMask / Dynamic MPC)
    Note over WC: EOA recorded. SCA NOT created yet!
    User->>WC: 3. Open Switch Modal & Click "OBYX Wallet"
    WC->>WC: 4. Explicitly invoke initCircleSmartAccount()
    User->>API: 5. POST /onramp/init (walletAddress: activeWalletAddress)
    API->>DB: 6. Update User.walletAddress = activeWalletAddress
    API-->>User: 201 Created (STK Push sent to active destination!)
```

---

## 2. Technical Scope & Implementation Roadmap

The implementation is divided into four distinct engineering subsystems. These tasks may be executed sequentially or in parallel by the engineering team.

### Phase 1: Dynamic SDK UX & Auth Synchronization (Frontend)
* [ ] **Task 1.1: Supabase Profile Injection into Dynamic Provider**
  * *Target File*: `apps/web/components/providers/DynamicProviderWrapper.tsx`
  * *Specification*: Inject `useAuth()` user profile session data into `DynamicContextProvider` settings and set `initialAuthenticationMode: "connect-only"` to bypass redundant email prompts during external wallet onboarding.
* [ ] **Task 1.2: Enforce Auth-Gating on Dashboard Wallet Widget**
  * *Target File*: `apps/web/components/dashboard/WalletWidget.tsx`
  * *Specification*: Validate Supabase authentication state (`if (!user)`) prior to rendering the wallet connection modal, redirecting unauthenticated visitors to `/auth/signup`.
* [ ] **Task 1.3: Enforce Auth-Gating on Swap Initiation Actions**
  * *Target File*: `apps/web/components/home/SwapWidget.tsx`
  * *Specification*: Add authentication verification to conversion action buttons to ensure users cannot attempt conversion flows without an active Supabase session.

### Phase 2: Explicit Lazy Circle SCA Provisioning (Frontend)
* [ ] **Task 2.1: Remove Eager SCA Auto-Initialization**
  * *Target File*: `apps/web/lib/WalletContext.tsx`
  * *Specification*: Remove the automatic `initCircleSmartAccount()` invocation from the primary EOA connection `useEffect` hook.
* [ ] **Task 2.2: Create Standalone SCA Provisioning Handler**
  * *Target File*: `apps/web/lib/WalletContext.tsx`
  * *Specification*: Implement an explicit `provisionObyxWallet()` method within the context and expose it through the public interface.
* [ ] **Task 2.3: Wire UI Selection to Explicit SCA Provisioning**
  * *Target File*: `apps/web/components/dashboard/WalletWidget.tsx`
  * *Specification*: Update the wallet switch popover such that selecting "OBYX Wallet" triggers `provisionObyxWallet()` if an embedded address has not yet been provisioned.

### Phase 3: Active Wallet Synchronization (Frontend $\rightarrow$ Backend)
* [ ] **Task 3.1: Synchronize Database Record on Active Wallet Switch**
  * *Target File*: `apps/web/components/dashboard/WalletWidget.tsx`
  * *Specification*: Invoke `UserService.postUserLinkWallet` whenever `setActiveWallet` toggles between external EOA and embedded SCA.
* [ ] **Task 3.2: Explicit Address Payload in Onramp Initiation**
  * *Target File*: `apps/web/components/home/SwapWidget.tsx`
  * *Specification*: Enforce that `OnrampService.postOnrampInit` payloads strictly include `walletAddress: activeWalletAddress` from context.

### Phase 4: Backend Address Resolution & DB Synchronization (Backend)
* [ ] **Task 4.1: Prioritize Requested Destination in Onramp Handler**
  * *Target File*: `apps/api/routes/onramp.routes.js`
  * *Action*: Refactor `/onramp/init` to prioritize `req.body.walletAddress` and update `user.walletAddress` in the database dynamically to ensure subsequent webhooks disburse correctly.
* [ ] **Task 4.2: Strict EVM Address Format Validation**
  * *Target File*: `apps/api/routes/onramp.routes.js`
  * *Action*: Implement strict regex validation (`^0x[a-fA-F0-9]{40}$`) on the resolved destination wallet before initiating the Paystack STK push.

---

## 3. Reference Implementation & Exact Code Modifications

### 3.1 `apps/web/components/providers/DynamicProviderWrapper.tsx`
**Engineering Goal**: Sync Supabase email profile with Dynamic SDK settings to bypass secondary email prompts.

```diff
  "use client";

  import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
  import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
  import { WagmiProvider } from "wagmi";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { wagmiConfig } from "@/lib/wagmi";
  import { WalletProvider } from "@/lib/WalletContext";
  import { TransactionHistoryProvider } from "@/lib/TransactionHistoryContext";
+ import { useAuth } from "@/lib/AuthContext";
  import type { ReactNode } from "react";

  const DYNAMIC_ENV_ID = (process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID || "placeholder-env-id") as string;
  const queryClient = new QueryClient();

  export function DynamicProviderWrapper({ children }: { children: ReactNode }) {
+   const { user } = useAuth();
+
    return (
      <DynamicContextProvider
        settings={{
          environmentId: DYNAMIC_ENV_ID,
          walletConnectors: [EthereumWalletConnectors],
          walletConnectPreferredChains: ["eip155:84532"], // Base Sepolia chain ID
+         initialAuthenticationMode: "connect-only",
+         userProfile: user ? { email: user.email } : undefined,
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <WalletProvider>
              <TransactionHistoryProvider>{children}</TransactionHistoryProvider>
            </WalletProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </DynamicContextProvider>
    );
  }
```

---

### 3.2 `apps/web/components/dashboard/WalletWidget.tsx`
**Engineering Goal**: Restrict wallet connection to authenticated users and bind embedded wallet selection to lazy SCA provisioning.

```diff
  export function WalletWidget() {
    const {
      walletAddress,
      circleAddress,
      activeWallet,
      setActiveWallet,
+     provisionObyxWallet,
      isConnected,
      isInitializingCircle,
      circleError,
      disconnect,
    } = useWallet();

    const { primaryWallet, setShowAuthFlow } = useDynamicContext();
    const { setShowLinkNewWalletModal } = useDynamicModals();
+   const { user } = useAuth();
+   const router = useRouter();

    // ... (keep helper methods)

    // ── Disconnected State ──
    if (!isConnected) {
+     if (!user) {
+       return (
+         <motion.button
+           whileHover={{ scale: 1.02 }}
+           whileTap={{ scale: 0.98 }}
+           onClick={() => router.push("/auth/signup")}
+           className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-neon-orange to-neon-amber text-white shadow-lg cursor-pointer"
+         >
+           <Wallet className="h-4 w-4" />
+           Sign Up to Connect Wallet
+         </motion.button>
+       );
+     }
+
      return (
        <DynamicWidget
          innerButtonComponent={
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_20px_rgba(255,107,0,0.25)] transition-all duration-300 cursor-pointer"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </motion.div>
          }
        />
      );
    }
    
    // ... (inside switch modal options)
    
                {/* OBYX Embedded Wallet (Circle SA) */}
                <button
-                 onClick={() => {
-                   setActiveWallet("embedded");
-                   setShowSwitchModal(false);
-                 }}
+                 onClick={async () => {
+                   setShowSwitchModal(false);
+                   if (!circleAddress) {
+                     await provisionObyxWallet();
+                   } else {
+                     setActiveWallet("embedded");
+                   }
+                 }}
                  className={cn(
```

---

### 3.3 `apps/web/lib/WalletContext.tsx`
**Engineering Goal**: Remove eager Circle SCA background initialization and expose an explicit provisioning handler.

```diff
  interface WalletContextType {
    walletAddress: string | null;
    circleAddress: string | null;
    activeWalletAddress: string | null;
    activeWallet: ActiveWalletType;
    setActiveWallet: (type: ActiveWalletType) => void;
+   provisionObyxWallet: () => Promise<void>;
    userPhone: string | null;
    setUserPhone: (phone: string | null) => void;
    isConnected: boolean;
    isInitializingCircle: boolean;
    circleError: string | null;
    sendGaslessSwap: (to: string, usdcAmount: number) => Promise<{ userOpHash: string; txHash: string; }>;
    disconnect: () => Promise<void>;
  }

  export function WalletProvider({ children }: { children: ReactNode }) {
    // ... state variables ...

    // ── Initialize EOA & Fetch Profile when wallet connects ──
    useEffect(() => {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        setWalletAddress(null);
        setCircleAddress(null);
        setUserPhone(null);
        setCircleError(null);
        bundlerClientRef.current = null;
        initAttemptedForRef.current = null;
        return;
      }

      const addr = primaryWallet.address;
      setWalletAddress(addr);

      UserService.getUserProfile().then((profile) => {
        if (profile?.phoneNumber) setUserPhone(profile.phoneNumber);
      });

-     // REMOVED EAGER CIRCLE SMART ACCOUNT INITIALIZATION HERE
    }, [primaryWallet]);

+   // ── Explicit SCA Provisioning Handler ──
+   const provisionObyxWallet = useCallback(async () => {
+     if (!primaryWallet || !walletAddress) return;
+     setIsInitializingCircle(true);
+     setCircleError(null);
+     try {
+       const walletClient = await (primaryWallet.connector as any).getWalletClient();
+       const smartAccount = await initCircleSmartAccount(walletClient as any, walletAddress);
+       const bundlerClient = createCircleBundlerClient(smartAccount);
+
+       bundlerClientRef.current = bundlerClient;
+       setCircleAddress(smartAccount.address);
+       setActiveWallet("embedded");
+
+       // Synchronize embedded wallet address with backend
+       await UserService.postUserLinkWallet({ walletAddress: smartAccount.address });
+       console.log("[WALLET] Provisioned & linked OBYX Smart Account:", smartAccount.address);
+     } catch (err: any) {
+       console.error("Circle Smart Account explicit init failed:", err);
+       setCircleError(err.message || "Failed to initialize OBYX Wallet");
+     } finally {
+       setIsInitializingCircle(false);
+     }
+   }, [primaryWallet, walletAddress]);

    // ... return Provider including provisionObyxWallet in value ...
  }
```

---

### 3.4 `apps/api/routes/onramp.routes.js`
**Engineering Goal**: Resolve active destination address cleanly and sync user database record for downstream webhooks.

```diff
    // --- Resolve destination wallet: prefer the active wallet sent by the frontend, fall back to stored EOA ---
    const targetWalletAddress = requestedWallet || user.walletAddress;
    if (!targetWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'No wallet address found. Please connect a wallet first.',
      });
    }

+   // --- Validate Ethereum Address Format ---
+   if (!/^0x[a-fA-F0-9]{40}$/.test(targetWalletAddress)) {
+     return res.status(400).json({
+       success: false,
+       error: 'Invalid target wallet address format.',
+     });
+   }

+   // --- Synchronize active wallet in database for downstream webhook disbursements ---
+   if (requestedWallet && requestedWallet !== user.walletAddress) {
+     user.walletAddress = targetWalletAddress;
+     await user.save();
+     console.log(`[ONRAMP] Synced User ${userId} active wallet to: ${targetWalletAddress}`);
+   }
```

---

## 4. Verification & Testing Protocol

Upon completion of the code modifications, execute the following validation steps:

1. **Auth Gating Verification**: In an unauthenticated browser session, navigate to the dashboard or home swap widget. Attempt to click "Connect Wallet". Verify redirection to `/auth/signup` without invoking the Dynamic SDK modal.
2. **Dynamic UX Verification**: Authenticate with a valid Supabase account. Invoke wallet connection and select MetaMask. Verify that MetaMask prompts for connection immediately without Dynamic SDK requesting email verification.
3. **Lazy Provisioning Verification**: Connect MetaMask EOA. Inspect local state and blockchain explorer; confirm `circleAddress` remains `null` and no counterfactual SCA contract is initialized. Navigate to wallet switcher, select "OBYX Wallet", and verify `provisionObyxWallet` executes and returns the SCA address.
4. **Dynamic Onramp Routing Verification**: Set active wallet to external EOA. Initiate a 100 KES Onramp transaction. Inspect server logs to confirm `[ONRAMP] Synced User ... active wallet to: 0x...`. Complete payment simulation and verify testnet USDC disbursement reaches the targeted EOA address.
