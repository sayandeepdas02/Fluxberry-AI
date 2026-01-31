import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/80",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                outline: "text-foreground border-border hover:bg-muted",
                neutral: "bg-muted text-muted-foreground border-transparent",
                destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
