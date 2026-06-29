"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

function AuthContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        // Auto-confirm is enabled — user is immediately signed in
        // AuthContext will handle the redirect to /dashboard
      } else if (data.user && !data.session) {
        // Email confirmation is required
        setSuccessMessage(
          "Check your email for a confirmation link to complete your sign up."
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
      // On success, AuthContext handles redirect
    }

    setLoading(false);
  };

  // Don't render until we know the auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="h-8 w-8 animate-spin text-neon-orange" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-neon-orange/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-info/[0.02] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-2.5 group mb-4">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-neon-orange/10 border border-neon-orange/20">
              <Zap className="h-5 w-5 text-neon-orange" />
              <div className="absolute inset-0 rounded-xl bg-neon-orange/5 group-hover:bg-neon-orange/10 transition-colors" />
            </div>
            <span className="font-mono text-xl font-bold tracking-wider text-white">
              OBYX
            </span>
          </Link>
          <p className="text-sm text-white/35">
            {mode === "login"
              ? "Welcome back. Sign in to your account."
              : "Create your account to get started."}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8">
          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 mb-8">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === "login"
                  ? "bg-neon-orange/15 text-neon-orange border border-neon-orange/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === "signup"
                  ? "bg-neon-orange/15 text-neon-orange border border-neon-orange/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error/Success messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger"
            >
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-sm text-success"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs text-white/30 font-medium uppercase tracking-wider mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none input-glow transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-white/30 font-medium uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-white/20 outline-none input-glow transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl py-4 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {loading
                  ? "Processing..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-white/[0.06]" />
            <span className="text-[10px] uppercase tracking-widest text-white/20">
              Secured by Supabase
            </span>
            <div className="flex-1 border-t border-white/[0.06]" />
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-white/20">
            By continuing, you agree to OBYX&apos;s Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-950">
          <Loader2 className="h-8 w-8 animate-spin text-neon-orange" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
