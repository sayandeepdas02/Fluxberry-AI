import { Navbar } from "@/components/shared/Navbar";
import { SignUpForm } from "@/features/auth/components/signup-form";
import { Footer } from "@/components/shared/Footer";
import { Panel, PanelContent } from "@/components/ui/panel";
import { FinalCTA } from "@/features/landing/components/final-cta";

export default function SignUpPage() {
    return (
        <>
            <Navbar />

            <div className="mx-auto md:max-w-6xl">
                <Panel>
                    <PanelContent className="py-20">
                        <SignUpForm />
                    </PanelContent>
                </Panel>

                <div>
                    <FinalCTA />
                </div>

                <div className="border-t border-edge mt-12">
                    <Footer />
                </div>

            </div>
        </>
    );
}
