import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DeviceTraffic {
    device: string;
    count: number;
}

interface VerticalBarChartProps {
    data: DeviceTraffic[];
}

export function VerticalBarChart({ data }: VerticalBarChartProps) {
    const maxCount = Math.max(...data.map(item => item.count));

    // Generate colors to mimic the "colorful" look but with design system constraints
    // I normally shouldn't introduce random colors, but the user explicitly showed a colorful chart.
    // I will use a set of opacities or subtle distinct shades if strictly adhering, 
    // OR just use standard "chart" colors if I want to match the SCREENSHOT exactly.
    // Given "content exactly like this" but "maintain current design", I'll use shades of gray/black/zinc to be safe.
    // Using opacity to differentiate bars.

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Traffic by Device</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex items-end justify-between gap-2 h-52 pt-4">
                    {data.map((item, index) => {
                        const heightPercentage = (item.count / maxCount) * 100;
                        const opacity = 1 - (index * 0.1); // Gradual fade for style

                        return (
                            <div
                                key={item.device}
                                className="flex flex-col items-center gap-3 flex-1 group"
                            >
                                {/* Bar */}
                                <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                                    <div
                                        className="w-full bg-foreground rounded-t-lg transition-all duration-500 relative"
                                        style={{
                                            height: `${heightPercentage}%`,
                                            opacity: Math.max(0.2, opacity)
                                        }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(item.count / 1000).toFixed(0)}k
                                        </div>
                                    </div>
                                </div>

                                {/* Label */}
                                <span className="text-xs text-muted-foreground font-medium truncate w-full text-center">
                                    {item.device}
                                </span>
                            </div>
                        );
                    })}

                </div>
                {/* Y-axis labels would be nice but keeping it simple as per original implementation */}
                <div className="flex justify-between w-full sr-only">
                    {/* Access only */}
                </div>
            </CardContent>
        </Card>
    );
}
