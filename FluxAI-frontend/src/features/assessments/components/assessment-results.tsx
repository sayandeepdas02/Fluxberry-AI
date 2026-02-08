"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Download, Brain, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { resultsApi, type AssessmentResultsResponse, type CandidateResultSummary } from "@/lib/api/results"

function deriveStatus(r: CandidateResultSummary): string {
    if (r.status === "COMPLETED") {
        if (r.percentage >= 80) return "Strong Hire"
        if (r.percentage >= 50) return "Consider"
        return "Reject"
    }
    if (r.status === "IN_PROGRESS") return "In Progress"
    if (r.status === "NOT_STARTED") return "Not Started"
    return r.status
}

function statusBadgeClass(status: string): string {
    if (status === "Strong Hire") return "bg-green-50 text-green-700 border-green-200"
    if (status === "Reject") return "bg-red-50 text-red-700 border-red-200"
    if (status === "Consider") return "bg-yellow-50 text-yellow-700 border-yellow-200"
    return "bg-muted text-muted-foreground"
}

export function AssessmentResults({ assessmentId }: { assessmentId: string }) {
    const [data, setData] = useState<AssessmentResultsResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    useEffect(() => {
        let cancelled = false
        resultsApi.getAssessmentResults(assessmentId).then((res) => {
            if (cancelled) return
            if (res.success && res.data) setData(res.data)
            else setError(res.error?.message ?? "Failed to load results")
            setLoading(false)
        }).catch(() => {
            if (!cancelled) {
                setError("Failed to load results")
                setLoading(false)
            }
        })
        return () => { cancelled = true }
    }, [assessmentId])

    const results = data?.results ?? []
    const filtered = search.trim()
        ? results.filter(
            (r) =>
                (r.candidateName ?? "").toLowerCase().includes(search.toLowerCase()) ||
                r.candidateEmail.toLowerCase().includes(search.toLowerCase())
        )
        : results

    const completed = results.filter((r) => r.status === "COMPLETED")
    const avgScore =
        completed.length > 0
            ? Math.round(completed.reduce((s, r) => s + r.percentage, 0) / completed.length)
            : null
    const topTier = completed.filter((r) => r.percentage >= 80).length
    const pending = (data?.totalCandidates ?? 0) - (data?.completedCount ?? 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/assessments">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        {error ?? "No data"}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/assessments">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{data.assessmentTitle}</h1>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{data.totalCandidates} candidates</span>
                            <span>•</span>
                            <span>{data.completedCount} completed</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/assessments/${assessmentId}/preview`} target="_blank">
                            Preview
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Avg Score</span>
                        <span className="text-2xl font-bold">{avgScore != null ? `${avgScore}%` : "—"}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Top Tier (≥80%)</span>
                        <span className="text-2xl font-bold text-green-600">{topTier}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Pending</span>
                        <span className="text-2xl font-bold text-orange-600">{pending}</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Completed</span>
                        <span className="text-2xl font-bold">{data.completedCount}</span>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search candidates..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Score</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Proctoring</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No candidates yet. Invite candidates to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((r) => {
                                        const status = deriveStatus(r)
                                        return (
                                            <tr key={r.attemptId} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium pl-4">
                                                    {r.candidateName || r.candidateEmail}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="outline" className={statusBadgeClass(status)}>
                                                        {status === "Strong Hire" && <Brain className="w-3 h-3 mr-1 inline" />}
                                                        {status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    r.percentage >= 80 ? "bg-green-500" : r.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                                }`}
                                                                style={{ width: `${Math.min(100, r.percentage)}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-mono text-xs">{r.percentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    {r.proctoringFlags > 0 ? (
                                                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> {r.proctoringFlags} flag{r.proctoringFlags !== 1 ? "s" : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/dashboard/assessments/${assessmentId}/results/candidate/${r.attemptId}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
