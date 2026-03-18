import { Navbar } from "@/components/shared/Navbar";
import { SignInForm } from "@/features/auth/components/signin-form";
import { Footer } from "@/components/shared/Footer";
import { Panel, PanelContent } from "@/components/ui/panel";
import { FinalCTA } from "@/features/landing/components/final-cta";

export default function SignInPage() {
    return (
        <>
            <Navbar />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                <Panel>
                    <PanelContent className="py-20">
                        <SignInForm />
                    </PanelContent>
                </Panel>


                <div className="border-t border-edge mt-12">
                    <Footer />
                </div>
            </div>
        </>
    );
}
