import { Panel, PanelContent, PanelHeader } from "@/components/ui/panel";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function BlogPreview() {
    const stories = [
        {
            title: "HR in Hybrid Work: Challenges and Solutions",
            category: "Future of work",
            image: "placeholder-1" // Just a graphic prop for now
        },
        {
            title: "The ROI of Investing in HR Technology",
            category: "HR tech",
            image: "placeholder-2"
        },
        {
            title: "The Role of AI in Diversity, Equity & Inclusion (DEI)",
            category: "Artificial Intelligence",
            image: "placeholder-3"
        }
    ];

    return (
        <Panel id="customer-stories">
            <PanelHeader>
                <div className="flex flex-col items-start gap-4">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground text-xs">●</span> Customer Stories
                    </span>

                    <div className="flex flex-col md:flex-row justify-between w-full md:items-end gap-6 border-b border-edge pb-8">
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground/90 max-w-sm">
                            Read our<br />Customer Stories
                        </h2>

                        <Link href="/blogs" className="inline-flex items-center text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors px-6 py-2 rounded-full border border-edge bg-muted/30 hover:bg-muted/50">
                            View all blogs <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </PanelHeader>

            <PanelContent className="py-12">
                <div className="grid md:grid-cols-3 gap-8">
                    {stories.map((story, index) => (
                        <div key={index} className="flex flex-col group cursor-pointer">
                            {/* Graphic Placeholder */}
                            <div className="w-full aspect-[4/3] bg-muted/30 border border-edge rounded-2xl mb-6 overflow-hidden relative shadow-sm transition-all group-hover:border-foreground/30">
                                <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center -z-10 group-hover:scale-105 transition-transform duration-500">
                                    <div className="w-[80%] h-[80%] rounded-xl bg-muted border border-edge shadow-sm flex items-center justify-center">
                                        <span className="text-xs font-medium text-muted-foreground/60">Blog Cover Graphic</span>
                                    </div>
                                </div>
                            </div>

                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                {story.category}
                            </span>
                            <h3 className="text-lg font-bold text-foreground/90 group-hover:text-muted-foreground transition-colors line-clamp-2">
                                {story.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </PanelContent>
        </Panel>
    );
}
