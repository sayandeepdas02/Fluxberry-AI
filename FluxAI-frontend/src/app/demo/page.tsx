import { Navbar } from "@/components/shared/Navbar";
import { DemoHero } from "@/features/demo/components/demo-hero";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";

export default function DemoPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background mx-auto w-full border-x border-line max-w-[var(--container-max)]">
            <Navbar />
            <DemoHero />
                <Separator />

            <FinalCTASection />
                <Separator />

            <Footer />
        </main>
    );
}
