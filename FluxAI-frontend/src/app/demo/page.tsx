import type { Metadata } from "next";
import { Navbar } from "@/components/shared/Navbar";
import { DemoHero } from "@/features/demo/components/demo-hero";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
    title: "Book a Demo — Fluxberry AI",
    description:
        "See Fluxberry AI in action. Schedule a personalized intro call and discover how AI-native hiring automation removes operational overhead for your team.",
    openGraph: {
        title: "Book a Demo — Fluxberry AI",
        description:
            "Schedule a 1:1 intro call to see how Fluxberry AI transforms your hiring workflow.",
        url: "https://fluxberry.ai/demo",
    },
};

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
