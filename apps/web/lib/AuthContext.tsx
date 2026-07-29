"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  // logs for console to check for issue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalRemoveItem = localStorage.removeItem;
      const originalClear = localStorage.clear;

      localStorage.removeItem = function (key) {
        if (key.includes('sb-') || key.includes('supabase')) {
          console.log("[DEBUG LOCALSTORAGE] removeItem called for Supabase key:", key);
          console.trace();
        }
        return originalRemoveItem.apply(this, arguments as any);
      };

      localStorage.clear = function () {
        console.log("[DEBUG LOCALSTORAGE] clear called");
        console.trace();
        return originalClear.apply(this, arguments as any);
      };
    }

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("[AUTH] getSession resolved. hasSession:", !!initialSession);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("[AUTH] onAuthStateChange event:", _event, "hasSession:", !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (_event === "SIGNED_IN") {
        console.log("[AUTH] SIGNED_IN event. Redirecting to /dashboard");
        router.push("/dashboard");
      }

      if (_event === "SIGNED_OUT") {
        console.log("[AUTH] SIGNED_OUT event. Redirecting to /");
        router.push("/");
      }
    });

    return () => {
      console.log("[AUTH] useEffect cleanup. Unsubscribing onAuthStateChange");
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'global' });

    // Clear any lingering Supabase session tokens from localStorage
    // to prevent stale session restoration on next page load.
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
