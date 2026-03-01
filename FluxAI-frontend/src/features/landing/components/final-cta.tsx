import { Button } from "@/components/ui/button";

export function FinalCTA() {
    return (
        <div className="mx-auto md:max-w-6xl">
            <div className="bg-foreground text-background rounded-lg p-12 md:p-16 my-8 text-center flex flex-col items-center">
                <div className="max-w-2xl">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                        Ready to hire smarter?
                    </h2>

                    <p className="text-lg text-background/80 mb-10 leading-relaxed max-w-xl mx-auto">
                        Join thousands of forward-thinking teams using Fluxberry AI to build their workforce.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button
                            size="lg"
                            className="bg-background text-foreground hover:bg-background/90 font-medium px-8"
                        >
                            Start Free Trial
                        </Button>
                        <Button
                            size="lg"
                            className="bg-background text-foreground hover:bg-background/90 font-medium px-8"
                        >
                            Book a Demo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
