import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PricingHero } from "@/features/pricing/components/pricing-hero";
import { PricingTiers } from "@/features/pricing/components/pricing-tiers";
import { PricingFeatureTable } from "@/features/pricing/components/pricing-feature-table";
import { PricingAiCredits } from "@/features/pricing/components/pricing-ai-credits";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";

export default function PricingPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background mx-auto w-full border-x border-line max-w-[var(--container-max)]">
            <Navbar />
            <PricingHero />
            <PricingTiers />
            <PricingFeatureTable />
            <PricingAiCredits />
            <FinalCTASection />
            <Footer />
        </main>
    );
}
