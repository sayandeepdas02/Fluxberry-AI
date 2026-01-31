import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: {
        direction: 'up' | 'down';
        percentage: number;
    } | null;
}

export function KPICard({ title, value, trend }: KPICardProps) {
    return (
        <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden bg-card transition-all hover:bg-muted/20">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground z-10">
                {title}
            </p>

            <div className="flex items-end justify-between z-10 mt-2">
                {/* Metric Value */}
                <p className="text-3xl font-bold tracking-tight">
                    {value}
                </p>

                {/* Trend Indicator */}
                {trend && (
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={cn(
                            "text-xs font-medium",
                            trend.direction === 'up' ? "text-foreground" : "text-muted-foreground" // Keeping it neutral/design system aligned unless forced
                        )}>
                            {trend.direction === 'up' ? '+' : '-'}{trend.percentage}%
                        </span>
                        {trend.direction === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-foreground/70" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-muted-foreground/70" />
                        )}
                    </div>
                )}
            </div>

            {/* Subtle background decoration to hint at the "colored" look without breaking design system */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                {/* Placeholder for potential icon or texture */}
            </div>
        </Card>
    );
}
