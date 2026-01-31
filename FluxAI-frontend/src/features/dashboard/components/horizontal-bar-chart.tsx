import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ApplicationSource {
    name: string;
    value: number; // raw value for sizing
}

interface HorizontalBarChartProps {
    data: ApplicationSource[];
}

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Applications coming from</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-6">
                    {data.map((source) => {
                        // Mocking the "pills" look - say each pill is 20%? or just a visual segmented bar
                        // Screenshot shows about 3-4 segments.
                        // I will approximate this with a segmented background or just a dashed line look.
                        // Simplest way to match "design": use a flex row of small divest.

                        return (
                            <div key={source.name} className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium w-24 truncate">{source.name}</span>

                                <div className="flex flex-1 gap-1 h-2">
                                    {/* Create 5 segments for visual style, fill based on value */}
                                    {[20, 40, 60, 80, 100].map((threshold) => (
                                        <div
                                            key={threshold}
                                            className={`h-full flex-1 rounded-sm ${source.value >= (threshold - 10) // Approx logic
                                                    ? "bg-foreground"
                                                    : "bg-muted"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
