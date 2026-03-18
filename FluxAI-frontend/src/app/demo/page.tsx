import { Navbar } from "@/components/shared/Navbar";
import { DemoHero } from "@/features/demo/components/demo-hero";
import { FinalCTA } from "@/features/landing/components/final-cta";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";

export default function DemoPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#FAFAFA]">
            <Navbar />
            <DemoHero />
                <Separator />

            <FinalCTA />
                <Separator />

            <Footer />
        </main>
    );
}
