import Link from "next/link";
import { Panel, PanelContent } from "@/components/ui/panel";

export function Footer() {
    return (
        <Panel>
            <PanelContent className="py-12">
                <div className="grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <div className="text-2xl font-bold mb-3">Fluxberry AI</div>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                            Hire better candidates. Faster. With confidence.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            © 2026 Fluxberry AI. All rights reserved.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="#features" className="hover:text-foreground transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#pricing" className="hover:text-foreground transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="#testimonials" className="hover:text-foreground transition-colors">
                                    Testimonials
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <a href="#" className="hover:text-foreground transition-colors">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground transition-colors">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground transition-colors">
                                    Careers
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </PanelContent>
        </Panel>
    );
}
