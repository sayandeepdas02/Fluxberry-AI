import * as React from "react";
import { cn } from "@/lib/utils";

function Panel({ className, ...props }: React.ComponentProps<"section">) {
    return (
        <section
            className={cn(
                "screen-line-before screen-line-after border-x border-border/40",
                className
            )}
            {...props}
        />
    );
}

function PanelHeader({ className, ...props }: React.ComponentProps<"header">) {
    return (
        <header
            className={cn("screen-line-after px-4 py-2", className)}
            {...props}
        />
    );
}

function PanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
    return (
        <h2
            className={cn("text-3xl font-semibold", className)}
            {...props}
        />
    );
}

function PanelContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div className={cn("p-4", className)} {...props} />
    );
}

export { Panel, PanelHeader, PanelTitle, PanelContent };
