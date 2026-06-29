"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  LayoutDashboard,
  ArrowLeftRight,
  LogOut,
  Wallet,
  Menu,
  X,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handleConnectWallet = () => {
    setConnectingWallet(true);
    // Simulated wallet connection — replace with real wallet integration
    setTimeout(() => {
      setWalletConnected(true);
      setWalletAddress("0x1a2B...9f4E");
      setConnectingWallet(false);
    }, 1500);
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
  };

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="h-8 w-8 animate-spin text-neon-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/[0.06] bg-surface-900/50">
        {/* Sidebar Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neon-orange/10 border border-neon-orange/20">
              <Zap className="h-4 w-4 text-neon-orange" />
            </div>
            <span className="font-mono text-lg font-bold tracking-wider text-white">
              OBYX
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-neon-orange/10 text-neon-orange border border-neon-orange/15"
                    : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-orange"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + Sign Out */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="px-4 py-2 mb-3">
            <p className="text-xs text-white/25 truncate font-mono">
              {user.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/35 hover:text-danger hover:bg-danger/5 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 border-r border-white/[0.06] bg-surface-900 lg:hidden flex flex-col"
            >
              {/* Logo + Close */}
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                    <Zap className="h-4 w-4 text-neon-orange" />
                  </div>
                  <span className="font-mono text-lg font-bold tracking-wider text-white">
                    OBYX
                  </span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-neon-orange/10 text-neon-orange border border-neon-orange/15"
                          : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Sign Out */}
              <div className="px-4 py-4 border-t border-white/[0.06]">
                <p className="px-4 py-2 mb-3 text-xs text-white/25 truncate font-mono">
                  {user.email}
                </p>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/35 hover:text-danger hover:bg-danger/5 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Mobile menu + breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-white/50 hover:text-white transition-colors -ml-2"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/30 font-mono">
                <Link
                  href="/"
                  className="hover:text-white/50 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 inline -mt-0.5" />
                  Home
                </Link>
                <span className="text-white/15">/</span>
                <span className="text-white/50">
                  {pathname === "/dashboard"
                    ? "Dashboard"
                    : pathname === "/dashboard/transactions"
                    ? "Transactions"
                    : "Dashboard"}
                </span>
              </div>
            </div>

            {/* Right: Wallet Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={
                walletConnected ? handleDisconnectWallet : handleConnectWallet
              }
              disabled={connectingWallet}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                walletConnected
                  ? "bg-success/10 border border-success/20 text-success hover:bg-success/15"
                  : "bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_20px_rgba(255,107,0,0.25)]",
                connectingWallet && "opacity-70 cursor-not-allowed"
              )}
            >
              {connectingWallet ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {connectingWallet
                ? "Connecting..."
                : walletConnected
                ? walletAddress
                : "Connect Wallet"}
            </motion.button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 cyber-bg">
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
