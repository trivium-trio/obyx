# Obyx: Seamless Web3 On/Off-Ramp for East Africa

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/trivium-trio/obyx?utm_source=oss&utm_medium=github&utm_campaign=trivium-trio%2Fobyx&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-Active_Development-success.svg)

---

## 🌍 The Problem

Our project addresses a systemic vulnerability in the East African Web3 landscape: the high fraud risk, counterparty dependency, and severe onboarding friction inherent in traditional Peer-to-Peer (P2P) crypto trading networks.

Traditional onramping requires users to interact with anonymous third parties, exposing them to scams and delays.

## 🚀 The Solution

We have engineered a non-custodial, automated fiat-to-stablecoin routing engine that functions as an architectural 'black box.' By abstracting the entire blockchain layer away from the end user, the platform allows direct conversion of Kenyan fiat currency (M-Pesa) into digital USD (USDC) with near-zero friction.

Mechanically, the architecture bridges localized payment rails with primary stablecoin issuance protocols. When a user initiates a transaction, our backend utilizes automated payment webhooks to capture local fiat and programmatically trigger Circle Mint APIs. This executes direct, primary minting of native USDC straight to the user's target self-custodial wallet address.

By bypassing credit card reliance and eliminating manual P2P intermediaries, we deliver an instantaneous, single-click financial on-ramp engineered specifically for emerging markets.

---

## ⚙️ Core Financial Pipelines

Obyx is powered by three highly-optimized financial engines:

### 1. Onramp Engine (KES -> USDC)
Direct conversion from M-Pesa to USDC. The system leverages the Paystack API for fiat collection and the Circle Mint API for primary stablecoin issuance.

### 2. Offramp Engine (USDC -> KES)
Instant liquidation from USDC back to M-Pesa. Powered by the Circle Paymaster, users enjoy 100% gasless transactions while the backend reconciles on-chain deposit webhooks to disburse fiat automatically.

### 3. Peer-to-Peer (P2P) Wallet Transfer Engine
Seamless USDC transfers between users. Features dual-wallet execution (Embedded gasless & External Wagmi), strict balance pre-flight verification, and self-send prohibition logic.

---

## 💻 Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js, React, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database & Auth** | Supabase, Dynamic Labs |
| **Web3 & Crypto** | Circle Programmable Wallets, Base Sepolia, Wagmi, Viem |
| **Fiat Integrations**| Paystack (M-Pesa Mobile Money) |

---

## 📚 Architecture Specifications

For detailed engineering designs and implementation plans, refer to our core architectural specifications:

* [ARCH-SPEC-01: Onramp & Wallet Auth Refactor](docs/refactor/01_onramp_and_wallet_auth_refactor.md)
* [ARCH-SPEC-02: Offramp Pipeline & Edge Case Gating](docs/refactor/02_offramp_pipeline_refactor.md)
* [ARCH-SPEC-03: Wallet-to-Wallet (P2P) Transfer Engine](docs/refactor/03_wallet_transfer_refactor.md)
* [ARCH-SPEC-04: SwapWidget De-monolithization](docs/refactor/04_swap_widget_demonolithization.md)

---

## 🛠️ Local Development Setup

To run Obyx locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/trivium-trio/obyx.git
   cd obyx
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file and populate it with your Supabase, Paystack, and Circle API keys.
4. **Start Development Servers**:
   ```bash
   npm run dev
   ```
