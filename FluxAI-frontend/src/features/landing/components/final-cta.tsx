import { Button } from "@/components/ui/button";

export function FinalCTA() {
    return (
        <div className="mx-auto md:max-w-5xl">
            <div className="bg-foreground text-background rounded-lg p-12 md:p-16 my-8">
                <div className="max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                        Let's Make Hiring That Teams Trust.
                    </h2>

                    <p className="text-lg text-background/80 mb-8 leading-relaxed">
                        Book a call or send a brief — we'll respond fast, we mean really really super fast, don't believe?
                    </p>

                    <Button
                        size="lg"
                        className="bg-background text-foreground hover:bg-background/90"
                    >
                        See pricing
                    </Button>
                </div>
            </div>
        </div>
    );
}
