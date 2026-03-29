import { Navbar } from "@/components/shared/Navbar";
import { Hero } from "@/features/landing/components/hero";
import { AgentsSection } from "@/features/landing/components/agents-section";
import { ProductShowcase } from "@/features/landing/components/product-showcase";
import { MetricsSection } from "@/features/landing/components/metrics-section";
import { PricingSection } from "@/features/landing/components/pricing-section";
import { TestimonialsSection } from "@/features/landing/components/testimonials-section";
import { FAQSection } from "@/features/landing/components/faq-section";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/shared/separator";

export default function Page() {
    return (
        <main className="flex min-h-screen flex-col bg-background">
            <Navbar />
            {/* Chanhdai-style panel container with border-x */}
            <div
                className="mx-auto w-full border-x border-line"
                style={{ maxWidth: "var(--container-max)" }}
            >
                <Hero />
                <Separator />
                <AgentsSection />
                <Separator />
                <ProductShowcase />
                <Separator />
                <MetricsSection />
                <Separator />
                <TestimonialsSection />
                <Separator />
                <PricingSection />
                <Separator />
                <FAQSection />
                <Separator />
                <FinalCTASection />
            </div>
            <Footer />
        </main>
    );
}
