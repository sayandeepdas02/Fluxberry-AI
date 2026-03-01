import { Navbar } from "@/components/shared/Navbar";
import { Separator } from "@/components/ui/separator";
import { Hero } from "@/features/landing/components/hero";
import { ValueProposition } from "@/features/landing/components/value-proposition";
import { CustomizableSolutions } from "@/features/landing/components/customizable-solutions";
import { Features } from "@/features/landing/components/features";
import { WhyChooseUs } from "@/features/landing/components/why-choose-us";
import { Testimonials } from "@/features/landing/components/testimonials";
import { FAQ } from "@/features/landing/components/faq";
import { FinalCTA } from "@/features/landing/components/final-cta";
import { Footer } from "@/components/shared/Footer";

export default function Page() {
    return (
        <>
            <Navbar />

            <div className="mx-auto md:max-w-6xl">
                <Hero />
                <Separator />

                <WhyChooseUs />
                <Separator />

                <ValueProposition />
                <Separator />

                <CustomizableSolutions />
                <Separator />

                <Features />
                <Separator />

                <Testimonials />
                <Separator />

                <FAQ />
                <Separator />

                <FinalCTA />
                <Separator />

                <Footer />
            </div>
        </>
    );
}
