"use client"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Code, Video, FileText, Download, Share2, Loader2 } from "lucide-react"
import Link from "next/link"
import { resultsApi, type AttemptResultResponse } from "@/lib/api/results"
import { AIInterviewViewer } from "@/features/dashboard/components/ai-interview-viewer"

const ROUND_ICONS: Record<string, React.ReactNode> = {
    MCQ: <FileText className="w-4 h-4" />,
    DSA: <Code className="w-4 h-4" />,
    AI: <Video className="w-4 h-4" />,
}

const ROUND_LABELS: Record<string, string> = {
    MCQ: "Technical MCQ",
    DSA: "Hands-on Coding",
    AI: "AI Video Interview",
}

function displayStatus(status: string): string {
    if (status === "COMPLETED") return "Completed"
    if (status === "IN_PROGRESS") return "In Progress"
    if (status === "NOT_STARTED") return "Not Started"
    if (status === "SKIPPED") return "Skipped"
    return status
}

function hireTier(percentage: number): string {
    if (percentage >= 80) return "Strong Hire"
    if (percentage >= 50) return "Consider"
    return "Reject"
}

export default function CandidateResultPage({ params }: { params: Promise<{ id: string; candidateId: string }> }) {
    const { id: assessmentId, candidateId: attemptId } = use(params)
    const [result, setResult] = useState<AttemptResultResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        resultsApi.getAttemptResult(attemptId).then((res) => {
            if (cancelled) return
            if (res.success && res.data) setResult(res.data)
            else setError(res.error?.message ?? "Failed to load result")
            setLoading(false)
        }).catch(() => {
            if (!cancelled) {
                setError("Failed to load result")
                setLoading(false)
            }
        })
        return () => { cancelled = true }
    }, [attemptId])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !result) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 py-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/assessments/${assessmentId}/results`}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {error ?? "Result not found"}
                    </CardContent>
                </Card>
            </div>
        )
    }

    const candidateName = result.candidateName || result.candidateEmail
    const statusLabel = result.status === "COMPLETED" ? hireTier(result.percentage) : displayStatus(result.status)
    const statusBadgeClass =
        statusLabel === "Strong Hire"
            ? "bg-green-100 text-green-700 border-green-200"
            : statusLabel === "Reject"
                ? "bg-red-100 text-red-700 border-red-200"
                : statusLabel === "Consider"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-muted text-muted-foreground"
    const hasProctoringFlags = result.proctoringSummary.totalEvents > 0

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/assessments/${assessmentId}/results`}>
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl tracking-tight">{candidateName}</h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{result.candidateEmail}</span>
                            <span>•</span>
                            <span>{result.assessmentTitle}</span>
                            {result.startedAt && (
                                <>
                                    <span>•</span>
                                    <span>Started {new Date(result.startedAt).toLocaleDateString()}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`${statusBadgeClass} hover:opacity-90 border text-sm py-1 px-3`}>
                        {statusLabel}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="w-4 h-4" /> Share Report
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> PDF
                    </Button>
                </div>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Assessment Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="relative flex justify-between items-center">
                            <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
                            {result.rounds.map((round, idx) => {
                                const pct = round.percentage != null ? round.percentage : 0
                                const isDone = round.status === "COMPLETED"
                                return (
                                    <div key={round.roundType} className="flex flex-col items-center gap-2 bg-background p-2 flex-1">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${isDone ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground" }`}
                                        >
                                            {ROUND_ICONS[round.roundType] ?? <FileText className="w-5 h-5" />}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-foreground">{round.roundType}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {round.percentage != null ? `${round.percentage}%` : "—"} / {displayStatus(round.status)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-2">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Score</div>
                        <div className="text-6xl tracking-tighter text-foreground">{result.percentage}</div>
                        <span className="text-muted-foreground text-sm">%</span>
                        {result.status === "COMPLETED" && (
                            <Badge variant="outline" className={`mt-2 ${statusBadgeClass}`}>
                                {statusLabel}
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Round-wise Breakdown */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold tracking-tight">Round-wise Breakdown</h3>
                {result.rounds.map((round) => {
                    const pct = round.percentage ?? 0
                    const isMcq = round.roundType === "MCQ"
                    const isDsa = round.roundType === "DSA"
                    const isAi = round.roundType === "AI"
                    const colorClass = isMcq ? "bg-blue-50 text-blue-600" : isDsa ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600"
                    const barClass = isMcq ? "bg-blue-600" : isDsa ? "bg-green-600" : "bg-purple-600"
                    return (
                        <Card key={round.roundType}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${colorClass}`}>
                                        {ROUND_ICONS[round.roundType]}
                                    </div>
                                    <CardTitle className="text-base">
                                        {round.roundType}: {ROUND_LABELS[round.roundType] ?? round.roundType}
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="text-muted-foreground">
                                        {displayStatus(round.status)}
                                    </Badge>
                                    {round.percentage != null && (
                                        <div className="text-xl">
                                            {round.percentage}%
                                            {round.maxScore != null && (
                                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                                    ({round.score ?? 0} / {round.maxScore})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${barClass}`}
                                        style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                </div>
                                {round.evaluatedAt && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Evaluated {new Date(round.evaluatedAt).toLocaleString()}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* AI Interview Section (if applicable) */}
            {result.rounds.some(r => r.roundType === 'AI') && (
                <AIInterviewViewer attemptId={attemptId} />
            )}

            {/* Proctoring */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" /> Proctoring Log
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {hasProctoringFlags ? (
                        <div className="space-y-4">
                            <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {result.proctoringSummary.totalEvents} event{result.proctoringSummary.totalEvents !== 1 ? "s" : ""} recorded
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.keys(result.proctoringSummary.bySeverity).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">By severity</p>
                                        <ul className="text-sm space-y-1">
                                            {Object.entries(result.proctoringSummary.bySeverity).map(([k, v]) => (
                                                <li key={k}>
                                                    {k}: {v}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {Object.keys(result.proctoringSummary.byType).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">By type</p>
                                        <ul className="text-sm space-y-1">
                                            {Object.entries(result.proctoringSummary.byType).map(([k, v]) => (
                                                <li key={k}>
                                                    {k}: {v}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>No suspicious activity detected during the session.</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
