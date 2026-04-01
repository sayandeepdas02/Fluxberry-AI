import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PricingHero } from "@/features/pricing/components/pricing-hero";
import { PricingTiers } from "@/features/pricing/components/pricing-tiers";
import { PricingFeatureTable } from "@/features/pricing/components/pricing-feature-table";
import { PricingAiCredits } from "@/features/pricing/components/pricing-ai-credits";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";

export default function PricingPage() {
    return (
        <>
            <Navbar />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                <PricingHero />
                <PricingTiers />
                <PricingFeatureTable />
                <PricingAiCredits />
                <FinalCTASection />

                <Footer />
            </div>
        </>
    );
}
