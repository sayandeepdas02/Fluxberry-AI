import { Button } from "@/components/ui/button";
import { Panel, PanelContent } from "@/components/ui/panel";

export function Hero() {
    return (
        <Panel id="hero">
            <PanelContent className="py-20 md:py-28">
                <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight tracking-tight">
                    AI Native Hiring Automation<br />for growing teams
                </h1>

                <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
                    Our AI Native platform helps you source, screen, interview and onboard talent
                </p>

                <div className="flex flex-wrap gap-4 mb-16">
                    <Button size="lg" className="text-base px-8 bg-foreground text-background hover:bg-foreground/90">
                        Start 14 day trial →
                    </Button>
                </div>

                <div className="mt-16 pt-10 border-t border-edge">
                    <p className="text-sm text-muted-foreground font-medium mb-8">
                        Trusted by:
                    </p>
                    <div className="flex items-center gap-8 md:gap-14 flex-wrap opacity-50 grayscale font-bold text-lg">
                        <div className="flex items-center gap-2"><div className="size-5 rounded-sm bg-foreground/40" /> Runeblottop</div>
                        <div className="flex items-center gap-2"><div className="size-5 rounded-full bg-foreground/40" /> Mythosync</div>
                        <div className="flex items-center gap-2"><div className="size-5 rounded-sm border-2 border-foreground/40" /> Fizzyriff</div>
                        <div className="flex items-center gap-2"><div className="size-5 rotate-45 bg-foreground/40" /> Voltara</div>
                        <div className="flex items-center gap-2"><div className="size-5 rounded-tl-full bg-foreground/40" /> Okbollox</div>
                        <div className="flex items-center gap-2"><div className="size-5 rounded-br-2xl bg-foreground/40" /> Tune</div>
                    </div>
                </div>
            </PanelContent>
        </Panel>
    );
}
