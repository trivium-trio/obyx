import { HeroSection } from "@/components/home/HeroSection";
import { TrustSection } from "@/components/home/TrustSection";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { TransactionStream } from "@/components/dashboard/TransactionStream";
import { OrderBook } from "@/components/dashboard/OrderBook";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { ProductFeaturesSection } from "@/components/home/ProductFeaturesSection";

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

      <ProductFeaturesSection />

      <TrustSection />
    </>
  );
}
