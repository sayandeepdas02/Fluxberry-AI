import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface LocationTraffic {
    country: string;
    percentage: number;
}

interface DonutChartProps {
    data: LocationTraffic[];
}

export function DonutChart({ data }: DonutChartProps) {
    const size = 180;
    const strokeWidth = 35;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    let currentAngle = -90;

    // Use shades of gray for segments
    const shades = [
        'text-foreground',    // Black
        'text-foreground/70', // Dark Gray
        'text-foreground/40', // Medium Gray
        'text-foreground/20', // Light Gray (Other)
    ];

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Traffic by Location</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex flex-row items-center justify-between gap-4">
                    {/* Donut */}
                    <div className="relative">
                        <svg
                            width={size}
                            height={size}
                            viewBox={`0 0 ${size} ${size}`}
                            className="transform rotate-0"
                        >
                            {data.map((item, index) => {
                                const angle = (item.percentage / 100) * 360;
                                const startAngle = currentAngle;
                                const endAngle = currentAngle + angle;
                                currentAngle += angle;

                                const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
                                const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
                                const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
                                const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

                                const largeArcFlag = angle > 180 ? 1 : 0;

                                const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                                return (
                                    <path
                                        key={item.country}
                                        d={path}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={strokeWidth}
                                        className={shades[index % shades.length]}
                                    />
                                );
                            })}
                        </svg>
                        {/* Inner white circle to ensure donut look if needed, but stroke takes care of it */}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-3 min-w-[120px]">
                        {data.map((item, index) => (
                            <div key={item.country} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full bg-current ${shades[index % shades.length].replace('text-', 'bg-')}`} />
                                    <span className="text-muted-foreground">{item.country}</span>
                                </div>
                                <span className="font-semibold">{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
