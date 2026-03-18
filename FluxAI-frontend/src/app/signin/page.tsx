import { Navbar } from "@/components/shared/Navbar";
import { SignInForm } from "@/features/auth/components/signin-form";
import { Footer } from "@/components/shared/Footer";
import { FinalCTA } from "@/features/landing/components/final-cta";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function SignInPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#FAFAFA]">
            <Navbar />

            <section className="w-full pt-6 md:pt-10 pb-0">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <div className="relative w-full rounded-[28px] overflow-hidden min-h-[600px] lg:min-h-[640px] flex items-center justify-center p-6 md:p-10 lg:p-12 mb-20">
                        {/* Background image */}
                        <Image
                            src="/demo-bg.png"
                            alt=""
                            fill
                            className="object-cover"
                            priority
                            quality={90}
                        />

                        {/* Dark overlay for readability */}
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Foreground Content */}
                        <div className="relative z-10 w-full max-w-[500px]">
                            <SignInForm />
                        </div>
                    </div>
                </div>
            </section>

            <Separator />
            <FinalCTA />
            <Separator />
            <Footer />
        </main>
    );
}
