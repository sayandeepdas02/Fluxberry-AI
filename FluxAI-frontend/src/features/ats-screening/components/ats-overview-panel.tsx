"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AnimatedCounter } from "./animated-counter"
import { Users, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react"

interface OverviewStatsProps {
    overview: {
        totalApplicants: number
        autoShortlisted: number
        needsReview: number
        rejected: number
        screeningInProgress: number
    }
}

export function AtsOverviewPanel({ overview }: OverviewStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={overview.totalApplicants} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Auto Shortlisted</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        <AnimatedCounter value={overview.autoShortlisted} />
                    </div>
                    <CardDescription className="text-xs text-green-600/80 mt-1">&ge; 80 Score</CardDescription>
                </CardContent>
            </Card>

            <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Needs Review</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                        <AnimatedCounter value={overview.needsReview} />
                    </div>
                    <CardDescription className="text-xs text-yellow-600/80 mt-1">60 - 79 Score</CardDescription>
                </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Rejected / Failed Gate</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                        <AnimatedCounter value={overview.rejected} />
                    </div>
                    <CardDescription className="text-xs text-red-600/80 mt-1">&lt; 60 Score or Hard Gate</CardDescription>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Screening In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <AnimatedCounter value={overview.screeningInProgress} />
                    </div>
                    <CardDescription className="text-xs mt-1">Pending AI parsing</CardDescription>
                </CardContent>
            </Card>
        </div>
    )
}
