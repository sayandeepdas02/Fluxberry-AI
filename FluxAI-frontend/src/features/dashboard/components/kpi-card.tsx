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
        <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden bg-background border border-line rounded-none shadow-none hover:border-foreground/30 transition-all duration-300">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground z-10 font-mono uppercase tracking-widest">
                {title}
            </p>

            <div className="flex items-end justify-between z-10 mt-2">
                {/* Metric Value */}
                <p className="text-4xl font-semibold tracking-tighter text-foreground">
                    {value}
                </p>

                {/* Trend Indicator */}
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1.5 mb-1 px-2 py-1 border font-medium text-xs rounded-none",
                        trend.direction === 'up' 
                            ? "bg-primary/5 text-primary border-primary/20" 
                            : "bg-destructive/5 text-destructive border-destructive/20"
                    )}>
                        <span>{trend.direction === 'up' ? '+' : '-'}{trend.percentage}%</span>
                        {trend.direction === 'up' ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
