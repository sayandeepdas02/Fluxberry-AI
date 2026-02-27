"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts"
import { AtsHistogramBin } from "@/lib/api/ats-screening"

interface AtsScoreHistogramProps {
    data: AtsHistogramBin[]
    percentiles: {
        p50: number
        p75: number
        p90: number
    }
}

export function AtsScoreHistogram({ data, percentiles }: AtsScoreHistogramProps) {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis
                                dataKey="range"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                            />

                            {/* Percentile Markers */}
                            <ReferenceLine x={`${Math.floor(percentiles.p50 / 10) * 10}-${Math.floor(percentiles.p50 / 10) * 10 + 9}`} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: `Median (${percentiles.p50})`, fill: 'currentColor', fontSize: 10 }} />
                            <ReferenceLine x={`${Math.floor(percentiles.p90 / 10) * 10}-${Math.floor(percentiles.p90 / 10) * 10 + 9}`} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: 'top', value: `Top 10% (${percentiles.p90})`, fill: 'currentColor', fontSize: 10 }} />

                            <Bar
                                dataKey="count"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
