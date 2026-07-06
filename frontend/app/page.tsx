import { HeroSection } from "@/components/home/HeroSection";
import { TrustSection } from "@/components/home/TrustSection";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { TransactionStream } from "@/components/dashboard/TransactionStream";
import { OrderBook } from "@/components/dashboard/OrderBook";
import { StatusCards } from "@/components/dashboard/StatusCards";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* ── The Terminal — Live Market Section ── */}
      <section className="relative cyber-bg pt-16 pb-8">
        {/* Scanline overlay */}
        <div className="scanline-overlay" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <DashboardHero />

          {/* Main grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction Stream - 2 cols */}
            <div className="lg:col-span-2">
              <TransactionStream />
            </div>

            {/* Order Book - 1 col */}
            <div className="lg:col-span-1">
              <OrderBook />
            </div>
          </div>
        </div>
      </section>

      {/* ── Market Status Section ── */}
      <section className="relative cyber-bg pb-16 pt-12 border-t border-white/[0.04]">
        <div className="scanline-overlay" />
        
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Network Intelligence
            </h2>
            <p className="text-sm text-white/40 max-w-2xl leading-relaxed">
              Real-time analytics monitoring the pulse of the market. Track overall sentiment,
              protocol health, volatility indicators, and current network gas fees before you execute your next swap.
            </p>
          </div>
          <StatusCards />
        </div>
      </section>

      <TrustSection />
    </>
  );
}
