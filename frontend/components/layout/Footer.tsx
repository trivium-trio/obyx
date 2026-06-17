import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] bg-surface-950">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                <Zap className="h-3.5 w-3.5 text-neon-orange" />
              </div>
              <span className="font-mono text-base font-bold tracking-wider text-white">
                OBYX
              </span>
            </div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              The fastest route between your cash and the crypto economy.
              Swap KSH to USDC in seconds, not days.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {["Home", "About", "Dashboard"].map((item) => (
                <li key={item}>
                  <Link
                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
              Connect
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/talk"
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} OBYX. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/20">Privacy</span>
            <span className="text-xs text-white/20">Terms</span>
            <span className="inline-flex items-center gap-1 text-xs text-neon-orange/40">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
