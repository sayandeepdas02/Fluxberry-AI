"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { AtsScoreBreakdownData } from "@/lib/api/ats-screening"

interface AtsBreakdownModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    data: AtsScoreBreakdownData | null
    isLoading: boolean
}

export function AtsBreakdownModal({ isOpen, onOpenChange, data, isLoading }: AtsBreakdownModalProps) {
    if (!data && !isLoading) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Scoring Breakdown
                        {data && (
                            <Badge variant="outline" className="ml-auto font-mono text-xs">
                                v{data.scoringVersion}
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Detailed AI analysis of candidate compatibility.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-24 text-center text-muted-foreground animate-pulse">Loading breakdown...</div>
                ) : data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

                        {/* Radar Chart */}
                        <div className="h-[300px] bg-slate-50/50 dark:bg-slate-900/50 rounded-lg p-4 border border-border">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                                    <PolarGrid opacity={0.5} />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: 'currentColor', fontSize: 12 }}
                                        className="text-muted-foreground"
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    />
                                    <Radar
                                        name="Score"
                                        dataKey="A"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Text Explanation Panel */}
                        <div className="space-y-6">

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-foreground">Final Score</h4>
                                <div className="text-4xl font-bold tracking-tight mb-1">
                                    <span className={data.finalScore >= 80 ? "text-green-600" : data.finalScore >= 60 ? "text-yellow-600" : "text-red-600"}>
                                        {data.finalScore}
                                    </span>
                                    <span className="text-muted-foreground text-xl"> / 100</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Confidence Rating: {data.confidenceScore}%
                                </div>
                            </div>

                            {data.status === 'FAILED_GATE' && data.hardGateFailureReason && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                                    <h5 className="text-sm font-semibold tracking-tight text-red-800 dark:text-red-400 mb-1">Hard Gate Failed</h5>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {data.hardGateFailureReason}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-semibold mb-2">Metrics Summary</h4>
                                <ul className="text-sm space-y-2 text-muted-foreground">
                                    <li className="flex justify-between">
                                        <span>Skill Match</span>
                                        <span className="font-medium text-foreground">{data.radarData.find(d => d.subject === 'Skills')?.A}%</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Experience Profile</span>
                                        <span className="font-medium text-foreground">{data.radarData.find(d => d.subject === 'Experience')?.A}%</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>Education</span>
                                        <span className="font-medium text-foreground">{data.radarData.find(d => d.subject === 'Education')?.A}%</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                ) : null}

            </DialogContent>
        </Dialog>
    )
}
