import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";

export function UseCases() {
    return (
        <Panel>
            <PanelHeader>
                <PanelTitle>Optimized for Modern Hiring Across Industries</PanelTitle>
            </PanelHeader>

            <PanelContent className="space-y-6">
                <ul className="space-y-3">
                    <li className="flex items-start">
                        <span className="mr-3 mt-1 text-muted-foreground">•</span>
                        <span className="text-base">Startups & Scaleups</span>
                    </li>

                    <li className="flex items-start">
                        <span className="mr-3 mt-1 text-muted-foreground">•</span>
                        <span className="text-base">Technology & Engineering Teams</span>
                    </li>

                    <li className="flex items-start">
                        <span className="mr-3 mt-1 text-muted-foreground">•</span>
                        <span className="text-base">Product & Design Roles</span>
                    </li>

                    <li className="flex items-start">
                        <span className="mr-3 mt-1 text-muted-foreground">•</span>
                        <span className="text-base">Operations & Analytics</span>
                    </li>

                    <li className="flex items-start">
                        <span className="mr-3 mt-1 text-muted-foreground">•</span>
                        <span className="text-base">Education & Training Programs</span>
                    </li>
                </ul>

                <p className="text-sm text-muted-foreground pt-4 border-t border-border/40">
                    FluxAI adapts to any hiring funnel that values quality and speed.
                </p>
            </PanelContent>
        </Panel>
    );
}
