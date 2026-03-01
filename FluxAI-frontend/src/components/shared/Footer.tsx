import Link from "next/link";
import { Panel, PanelContent } from "@/components/ui/panel";

export function Footer() {
    return (
        <Panel>
            <PanelContent className="py-16 md:py-24">
                <div className="grid gap-12 md:grid-cols-5 border-t border-border pt-16">
                    <div className="md:col-span-2">
                        <div className="text-2xl font-bold mb-4 tracking-tight">Fluxberry AI</div>
                        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
                            Empowering HR teams with intelligent automation.
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            © {new Date().getFullYear()} Fluxberry AI. All rights reserved.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-6 text-foreground/90">Product</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="#integrations" className="hover:text-foreground transition-colors">Integrations</Link></li>
                            <li><Link href="#changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-6 text-foreground/90">Resources</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                            <li><Link href="#help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                            <li><Link href="#cases" className="hover:text-foreground transition-colors">Case Studies</Link></li>
                            <li><Link href="#webinars" className="hover:text-foreground transition-colors">Webinars</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-6 text-foreground/90">Company</h3>
                        <ul className="space-y-4 text-sm text-muted-foreground">
                            <li><Link href="#about" className="hover:text-foreground transition-colors">About Us</Link></li>
                            <li><Link href="#careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                            <li><Link href="#contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
                    <div className="flex gap-6">
                        <Link href="#legal" className="hover:text-foreground transition-colors">Legal</Link>
                        <Link href="#privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link href="#terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                        <Link href="#cookie" className="hover:text-foreground transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </PanelContent>
        </Panel>
    );
}
