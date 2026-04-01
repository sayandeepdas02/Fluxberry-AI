import { Navbar } from "@/components/shared/Navbar";
import { SignInForm } from "@/features/auth/components/signin-form";
import { Footer } from "@/components/shared/Footer";
import { FinalCTASection } from "@/features/landing/components/final-cta-section";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function SignInPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <section className="w-full pt-12 md:pt-20 pb-20 flex-1 flex flex-col justify-center">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 w-full">
                    <SignInForm />
                </div>
            </section>

            <Separator />
            <FinalCTASection />
            <Separator />
            <Footer />
        </main>
    );
}
