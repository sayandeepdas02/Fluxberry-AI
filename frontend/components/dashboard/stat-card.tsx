import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
    title: string
    value: string
    description?: string
    icon: React.ReactNode
    trend?: {
        value: string
        label: string
        positive: boolean
    }
}

export function StatCard({ title, value, description, icon, trend }: StatCardProps) {
    return (
        <Card className="border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-50/50 text-red-600 rounded-xl ring-1 ring-red-100/50">
                            {icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h2>
                        </div>
                    </div>
                </div>
                {(trend || description) && (
                    <div className="mt-4 flex items-center text-sm">
                        {trend && (
                            <span
                                className={cn(
                                    "mr-2 font-medium",
                                    trend.positive ? "text-emerald-600" : "text-rose-600"
                                )}
                            >
                                {trend.positive ? "+" : "-"}{trend.value}
                            </span>
                        )}
                        <span className="text-slate-500">
                            {trend ? trend.label : description}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
