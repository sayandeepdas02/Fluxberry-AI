"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HiringActivityData {
    months: string[];
    thisYear: number[];
    lastYear: number[];
}

interface LineChartProps {
    data: HiringActivityData;
}

// Helper to generate smooth SVG path
function getSmoothPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[0];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
}

export function LineChart({ data }: LineChartProps) {
    const [activeTab, setActiveTab] = useState("Total Users");

    const { months, thisYear, lastYear } = data;

    // Calculate chart dimensions
    const width = 800;
    const height = 300;
    const padding = { top: 40, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate max value for scaling
    const maxValue = Math.max(...thisYear, ...lastYear) * 1.2; // Add headroom
    const yScale = chartHeight / maxValue;
    const xScale = chartWidth / (months.length - 1);

    // Generate points
    const thisYearPoints = thisYear.map((value, index) => ({
        x: padding.left + index * xScale,
        y: padding.top + chartHeight - value * yScale,
    }));

    const lastYearPoints = lastYear.map((value, index) => ({
        x: padding.left + index * xScale,
        y: padding.top + chartHeight - value * yScale,
    }));

    const thisYearPath = getSmoothPath(thisYearPoints);
    const lastYearPath = getSmoothPath(lastYearPoints);

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-6">
                {/* Tabs / Title Replacement */}
                <div className="flex items-center space-x-6 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {["Total Users", "Total Projects", "Operating Status"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "text-sm font-medium whitespace-nowrap transition-colors relative pb-2",
                                activeTab === tab
                                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Legend Toggle */}
                <div className="flex items-center gap-4 text-xs font-medium mt-4 sm:mt-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-foreground" />
                        <span>This year</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        <span className="text-muted-foreground">Last year</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="w-full overflow-hidden">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto"
                        style={{ maxHeight: '300px' }}
                    >
                        {/* Y-axis grid lines (dashed) */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = padding.top + chartHeight - chartHeight * ratio;
                            const value = Math.round(maxValue * ratio);
                            // Format large numbers (e.g. 10k)
                            const label = value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value;

                            return (
                                <g key={ratio}>
                                    <line
                                        x1={padding.left}
                                        y1={y}
                                        x2={width - padding.right}
                                        y2={y}
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        className="text-border/40" // lighter grid
                                        strokeDasharray="4 4"
                                    />
                                    <text
                                        x={padding.left - 12}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="text-[10px] fill-muted-foreground"
                                    >
                                        {label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* X-axis labels */}
                        {months.map((month, index) => {
                            const x = padding.left + index * xScale;
                            return (
                                <text
                                    key={`${month}-${index}`}
                                    x={x}
                                    y={height - padding.bottom + 20}
                                    textAnchor="middle"
                                    className="text-[10px] fill-muted-foreground"
                                >
                                    {month}
                                </text>
                            );
                        })}

                        {/* Last Year - Dotted Line */}
                        <path
                            d={lastYearPath}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted-foreground/30"
                            strokeDasharray="4 4"
                        />

                        {/* This Year - Solid Line */}
                        <path
                            d={thisYearPath}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-foreground"
                        />

                        {/* Optional Gradient Fill for This Year? 
                             The screenshot looks like a simple line. I'll stick to line to be safe.
                         */}

                    </svg>
                </div>
            </CardContent>
        </Card>
    );
}
