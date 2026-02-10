import { Button } from "@/components/ui/button";
import { Panel, PanelContent } from "@/components/ui/panel";

export function Hero() {
    return (
        <Panel id="hero">
            <PanelContent className="py-20 md:py-28">
                <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight tracking-tight">
                    Hire Smarter. Faster.<br />With AI That Actually Works.
                </h1>

                <p className="text-xl text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                    Fluxberry AI helps companies design better hiring funnels, automatically screen candidates,
                    and hire high-quality talent — without wasting recruiter or engineering time.
                </p>

                <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
                    Build structured applications, parse resumes intelligently, and focus only on candidates worth interviewing.
                </p>

                <div className="flex flex-wrap gap-4">
                    <Button size="lg" className="text-base px-8">
                        Get Started
                    </Button>
                    <Button size="lg" variant="outline" className="text-base px-8">
                        Request a Demo
                    </Button>
                </div>

                <div className="mt-16 pt-10 border-t border-edge">
                    <p className="text-sm text-muted-foreground font-medium mb-4">
                        Trusted by fast-growing teams hiring engineers, analysts, and operators
                    </p>
                    <div className="flex items-center gap-8 flex-wrap text-sm text-muted-foreground">
                        <div>
                            <span className="text-2xl font-bold text-foreground">100k+</span>
                            <span className="ml-2">applications processed</span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-foreground">78k+</span>
                            <span className="ml-2">candidates screened</span>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-foreground">4.9/5</span>
                            <span className="ml-2">satisfaction</span>
                        </div>
                    </div>
                </div>
            </PanelContent>
        </Panel>
    );
}
