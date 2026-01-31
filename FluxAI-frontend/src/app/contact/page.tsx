import { Navbar } from "@/components/shared/Navbar";
import { ContactForm } from "@/features/contact/components/contact-form";
import { FAQ } from "@/features/landing/components/faq";
import { FinalCTA } from "@/features/landing/components/final-cta";
import { Footer } from "@/components/shared/Footer";
import { Separator } from "@/components/ui/separator";
import { Panel, PanelContent } from "@/components/ui/panel";

export default function ContactPage() {
    return (
        <>
            <Navbar />

            <div className="mx-auto md:max-w-5xl">
                {/* Contact Form Section */}
                <Panel>
                    <PanelContent className="py-16">
                        <ContactForm />
                    </PanelContent>
                </Panel>

                <Separator />

                {/* FAQ Section */}
                <FAQ />

                <Separator />

                {/* CTA Section */}
                <FinalCTA />

                <Separator />

                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}
