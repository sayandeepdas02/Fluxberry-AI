import { Navbar } from "@/components/shared/Navbar";
import { Separator } from "@/components/ui/separator";
import { Hero } from "@/features/landing/components/hero";
import { Features } from "@/features/landing/components/features";
import { WhyChooseUs } from "@/features/landing/components/why-choose-us";
import { Products } from "@/features/landing/components/products";
import { Pricing } from "@/features/landing/components/pricing";
import { Testimonials } from "@/features/landing/components/testimonials";
import { FAQ } from "@/features/landing/components/faq";
import { FinalCTA } from "@/features/landing/components/final-cta";
import { Footer } from "@/components/shared/Footer";

export default function Page() {
    return (
        <main className="flex min-h-screen flex-col bg-[#FAFAFA]">
            <Navbar />
            <Hero />
                <Separator />

            <Features />
                <Separator />

            <WhyChooseUs />
                <Separator />

            <Products />
                <Separator />

            <Pricing />
                <Separator />

            <Testimonials />
                <Separator />

            <FAQ />
                <Separator />

            <FinalCTA />
                <Separator />

            <Footer />
        </main>
    );
}
