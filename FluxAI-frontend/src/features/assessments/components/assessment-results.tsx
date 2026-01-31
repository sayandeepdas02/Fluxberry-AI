"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Filter, MoreHorizontal, Download, Brain, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const candidates = [
    { id: 1, name: "Arjun K.", score: 92, status: "Strong Hire", rounds: { r1: 95, r2: 90, r3: "Pass" }, flags: 0 },
    { id: 2, name: "Sarah M.", score: 88, status: "Strong Hire", rounds: { r1: 85, r2: 92, r3: "Pass" }, flags: 0 },
    { id: 3, name: "David L.", score: 74, status: "Consider", rounds: { r1: 70, r2: 78, r3: "Flagged" }, flags: 1 },
    { id: 4, name: "Priya R.", score: 45, status: "Reject", rounds: { r1: 40, r2: 50, r3: "Incomplete" }, flags: 0 },
    { id: 5, name: "James W.", score: 68, status: "Consider", rounds: { r1: 75, r2: 60, r3: "Pass" }, flags: 2 },
]

export function AssessmentResults({ assessmentId }: { assessmentId: string }) {
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
                            <h1 className="text-2xl font-bold tracking-tight">Senior Frontend Engineer</h1>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Created Jan 28, 2024</span>
                            <span>•</span>
                            <span>124 Invited</span>
                            <span>•</span>
                            <span>86 Completed</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/assessments/${assessmentId}/preview`} target="_blank">
                            Preview
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        Close Assessment
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Avg Score</span>
                        <span className="text-2xl font-bold">76%</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Top Tier</span>
                        <span className="text-2xl font-bold text-green-600">12%</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Pending</span>
                        <span className="text-2xl font-bold text-orange-600">38</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Avg Time</span>
                        <span className="text-2xl font-bold">42m</span>
                    </CardContent>
                </Card>
            </div>

            {/* Candidate List */}
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search candidates..." className="pl-9" />
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                    </div>

                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Score</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">MCQ</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">DSA</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Interview</th>
                                    <th className="h-12 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {candidates.map((c) => (
                                    <tr key={c.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer">
                                        <td className="p-4 align-middle font-medium pl-4">{c.name}</td>
                                        <td className="p-4 align-middle">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    c.status === 'Strong Hire' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        c.status === 'Reject' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }
                                            >
                                                {c.status === 'Strong Hire' && <Brain className="w-3 h-3 mr-1" />}
                                                {c.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${c.score > 80 ? 'bg-green-500' : c.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${c.score}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs">{c.score}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle font-mono text-muted-foreground">{c.rounds.r1}%</td>
                                        <td className="p-4 align-middle font-mono text-muted-foreground">{c.rounds.r2}%</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant="outline" className={
                                                c.rounds.r3 === 'Pass' ? 'bg-green-50 text-green-700' :
                                                    c.rounds.r3 === 'Flagged' ? 'bg-red-50 text-red-700' :
                                                        'text-muted-foreground'
                                            }>
                                                {c.rounds.r3}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {c.flags > 0 && <span className="text-xs text-red-600 mr-2 font-medium">{c.flags} Flags</span>}
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/assessments/${assessmentId}/results/candidate/${c.id}`}>View</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
