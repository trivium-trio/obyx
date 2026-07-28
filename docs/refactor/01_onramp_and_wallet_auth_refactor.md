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
