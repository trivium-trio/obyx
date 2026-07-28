# Architecture Specification 04: SwapWidget De-monolithization

**Document ID**: `ARCH-SPEC-04`  
**Status**: Approved for Engineering Implementation  
**Target Subsystems**: Frontend SwapWidget Component  
**Primary Objective**: Refactor the massive 947-line `SwapWidget.tsx` monolith into clean, isolated, and maintainable React components housed in a dedicated `components/swap/` module.

---

## 1. Executive Summary & Architectural Motivation

### 1.1 Problem Statement
Currently, `apps/web/components/home/SwapWidget.tsx` is an unmanageable 947-line monolith containing:
1. The main dashboard widget UI and modal routing state.
2. `SwapToCashModal` (Offramp logic).
3. `SwapToCryptoModal` (Onramp logic).
4. `WalletTransferModal` (P2P Transfer logic).

This violates the Single Responsibility Principle, creates high risk for git merge conflicts, and makes implementing the upcoming security gating (Specs 01-03) dangerous and difficult.

### 1.2 Target Architecture
The UI logic will be distributed into a dedicated `swap` domain directory:
```text
apps/web/components/
└── swap/
    ├── SwapWidget.tsx                 (Main Shell & Orchestrator)
    ├── shared/
    │   └── AnimatedKeypad.tsx         (Shared UI components)
    └── modals/
        ├── SwapToCashModal.tsx        (Offramp Engine)
        ├── SwapToCryptoModal.tsx      (Onramp Engine)
        └── WalletTransferModal.tsx    (P2P Engine)
```

---

## 2. Step-by-Step Implementation Plan

### Phase 1: Directory Scaffolding & Shared Extractor
* [ ] **Task 1.1**: `chore(swap): scaffold swap module directory structure`
  * *Action*: Create `apps/web/components/swap/`, `swap/modals/`, and `swap/shared/`.
* [ ] **Task 1.2**: `refactor(swap): extract shared UI components`
  * *Action*: Identify duplicated components (e.g., custom numeric keypads or token selectors) in `SwapWidget.tsx` and extract them into `swap/shared/`.

### Phase 2: Modal Isolation
* [ ] **Task 2.1**: `refactor(swap): extract SwapToCashModal to standalone file`
  * *File*: `apps/web/components/swap/modals/SwapToCashModal.tsx`
  * *Action*: Move lines ~100-300 from `home/SwapWidget.tsx` into this file. Export it as a default module.
* [ ] **Task 2.2**: `refactor(swap): extract SwapToCryptoModal to standalone file`
  * *File*: `apps/web/components/swap/modals/SwapToCryptoModal.tsx`
  * *Action*: Move lines ~300-490 from `home/SwapWidget.tsx` into this file.
* [ ] **Task 2.3**: `refactor(swap): extract WalletTransferModal to standalone file`
  * *File*: `apps/web/components/swap/modals/WalletTransferModal.tsx`
  * *Action*: Move lines ~490-850 from `home/SwapWidget.tsx` into this file.

### Phase 3: Orchestrator Refactor & Cleanup
* [ ] **Task 3.1**: `refactor(swap): convert SwapWidget to lightweight orchestrator`
  * *File*: `apps/web/components/swap/SwapWidget.tsx`
  * *Action*: Refactor the main shell to simply import the standalone modals and render them conditionally based on `activeModal` state.
* [ ] **Task 3.2**: `refactor(swap): update dashboard page imports`
  * *File*: `apps/web/app/(dashboard)/page.tsx` (and `home/HeroSection.tsx` if applicable)
  * *Action*: Update all imports pointing to `components/home/SwapWidget` to point to the new `components/swap/SwapWidget`.
* [ ] **Task 3.3**: `chore(swap): delete monolithic legacy widget`
  * *Action*: Delete `apps/web/components/home/SwapWidget.tsx` to finalize the migration.

---

## 3. Reference Implementation & Code Modifications

### 3.1 `apps/web/components/swap/SwapWidget.tsx` (Orchestrator)
**Engineering Goal**: Act strictly as a UI shell and state router.

```tsx
import React, { useState } from "react";
import SwapToCashModal from "./modals/SwapToCashModal";
import SwapToCryptoModal from "./modals/SwapToCryptoModal";
import WalletTransferModal from "./modals/WalletTransferModal";

export function SwapWidget() {
  const [activeModal, setActiveModal] = useState<"cash" | "crypto" | "transfer" | null>(null);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* ... Dashboard Render Buttons ... */}
      
      {activeModal === "cash" && <SwapToCashModal isOpen={true} onClose={() => setActiveModal(null)} />}
      {activeModal === "crypto" && <SwapToCryptoModal isOpen={true} onClose={() => setActiveModal(null)} />}
      {activeModal === "transfer" && <WalletTransferModal isOpen={true} onClose={() => setActiveModal(null)} />}
    </div>
  );
}
```

---

## 4. Verification & Testing Protocol

Upon completion of the structural refactor, verify functional parity:

1. **Routing Verification**: Click "Cash Out" on the dashboard. Ensure the Offramp modal mounts without crashing.
2. **Context Integrity Verification**: Inside each modal, verify that `useWallet()` and `useAuth()` contexts are correctly resolving (i.e., user balances are visible).
3. **Build Compilation Test**: Run `npm run build` to guarantee no broken import paths remain from `components/home/SwapWidget`.
