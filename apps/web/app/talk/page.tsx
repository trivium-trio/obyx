"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MessageSquare, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const subjects = [
  "Institutional Partnership",
  "High-Volume Trading",
  "API Integration",
  "Technical Support",
  "General Inquiry",
];

export default function TalkPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen pt-28">
      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* ── Hero ── */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.06] px-4 py-1.5 text-xs font-medium text-white/50 tracking-wide mb-6">
              <MessageSquare className="h-3 w-3" />
              GET IN TOUCH
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Let&apos;s Talk
            </h1>
            <p className="text-base text-white/35 leading-relaxed">
              Whether you&apos;re an institutional partner, a high-volume trader,
              or need support — we respond fast.
            </p>
          </motion.div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ── Form + Contact Info ── */}
        <section className="py-16 grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Name */}
            <div className="group">
              <label className="block text-xs text-white/30 font-medium uppercase tracking-wider mb-3">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Your full name"
                className={cn(
                  "w-full bg-transparent border-b border-white/[0.08] pb-3 text-white",
                  "placeholder:text-white/15 text-base outline-none",
                  "transition-all duration-300 input-glow",
                  "focus:border-neon-orange"
                )}
              />
            </div>

            {/* Email */}
            <div className="group">
              <label className="block text-xs text-white/30 font-medium uppercase tracking-wider mb-3">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="you@company.com"
                className={cn(
                  "w-full bg-transparent border-b border-white/[0.08] pb-3 text-white",
                  "placeholder:text-white/15 text-base outline-none",
                  "transition-all duration-300 input-glow",
                  "focus:border-neon-orange"
                )}
              />
            </div>

            {/* Subject */}
            <div className="group">
              <label className="block text-xs text-white/30 font-medium uppercase tracking-wider mb-3">
                Subject
              </label>
              <select
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className={cn(
                  "w-full bg-transparent border-b border-white/[0.08] pb-3 text-white",
                  "text-base outline-none appearance-none cursor-pointer",
                  "transition-all duration-300 input-glow",
                  "focus:border-neon-orange",
                  !formData.subject && "text-white/15"
                )}
              >
                <option value="" disabled className="bg-surface-800 text-white/30">
                  Select a topic
                </option>
                {subjects.map((s) => (
                  <option key={s} value={s} className="bg-surface-800 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="group">
              <label className="block text-xs text-white/30 font-medium uppercase tracking-wider mb-3">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Tell us about your needs..."
                className={cn(
                  "w-full bg-transparent border-b border-white/[0.08] pb-3 text-white resize-none",
                  "placeholder:text-white/15 text-base outline-none",
                  "transition-all duration-300 input-glow",
                  "focus:border-neon-orange"
                )}
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold transition-all duration-300",
                isSubmitted
                  ? "bg-success/20 text-success border border-success/20"
                  : "bg-gradient-to-r from-neon-orange to-neon-amber text-white hover:shadow-[0_0_30px_rgba(255,107,0,0.3)]",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitted ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Message Sent
                </>
              ) : isSubmitting ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Sending...
                </motion.span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-8"
          >
            <div>
              <h3 className="text-xs text-white/30 font-medium uppercase tracking-wider mb-4">
                Direct channels
              </h3>
              <div className="space-y-4">
                {[
                  {
                    icon: Mail,
                    label: "hello@obyx.io",
                    href: "mailto:hello@obyx.io",
                  },
                  {
                    icon: ArrowUpRight,
                    label: "@obyx on X",
                    href: "https://twitter.com/obyx",
                  },
                  {
                    icon: MessageSquare,
                    label: "t.me/obyx",
                    href: "https://t.me/obyx",
                  },
                ].map((channel) => (
                  <a
                    key={channel.label}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-800/30 p-4 hover:border-white/[0.1] hover:bg-surface-800/60 transition-all duration-200"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                      <channel.icon className="h-4 w-4 text-white/40 group-hover:text-neon-orange transition-colors" />
                    </div>
                    <span className="text-sm text-white/50 group-hover:text-white/80 transition-colors">
                      {channel.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div className="rounded-xl border border-white/[0.04] bg-surface-800/20 p-5">
              <p className="text-xs text-white/25 leading-relaxed">
                <span className="text-white/40 font-medium">Response time:</span>{" "}
                We typically respond within 2 hours during business hours
                (EAT, UTC+3). For urgent matters, reach us on Telegram.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
