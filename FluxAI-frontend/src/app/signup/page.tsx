import { Navbar } from "@/components/shared/Navbar";
import { SignUpForm } from "@/features/auth/components/signup-form";
import { Footer } from "@/components/shared/Footer";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function SignUpPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background mx-auto w-full border-x border-line max-w-[var(--container-max)]">
            <Navbar />

            <section className="w-full pt-12 md:pt-20 pb-20 flex-1 flex flex-col justify-center">
                <div className="mx-auto px-6 sm:px-8 w-full">
                    <SignUpForm />
                </div>
            </section>

            <Separator />
            <FinalCTASection />
            <Separator />
            <Footer />
        </main>
    );
}
