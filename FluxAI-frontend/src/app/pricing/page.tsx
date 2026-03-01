import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { PricingHero } from "@/features/pricing/components/pricing-hero";
import { PricingTiers } from "@/features/pricing/components/pricing-tiers";
import { PricingFeatureTable } from "@/features/pricing/components/pricing-feature-table";
import { PricingAiCredits } from "@/features/pricing/components/pricing-ai-credits";
import { FinalCTA } from "@/features/landing/components/final-cta";

export default function PricingPage() {
    return (
        <>
            <Navbar />

            <div className="mx-auto md:max-w-6xl">
                <PricingHero />
                <PricingTiers />
                <PricingFeatureTable />
                <PricingAiCredits />
                <FinalCTA />

                <Footer />
            </div>
        </>
    );
}
