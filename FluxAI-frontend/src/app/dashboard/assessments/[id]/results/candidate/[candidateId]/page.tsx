"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, AlertCircle, Clock, Code, Video, FileText, Download, Share2 } from "lucide-react"
import Link from "next/link"

export default function CandidateResultPage({ params }: { params: { id: string, candidateId: string } }) {
    // Mock data for a specific candidate
    const candidate = {
        name: "Arjun K.",
        email: "arjun.k@example.com",
        role: "Senior Frontend Engineer",
        status: "Strong Hire",
        overallScore: 92,
        appliedDate: "Jan 28, 2024",
        rounds: {
            r1: { score: 95, status: "Pass", duration: "32m" },
            r2: { score: 90, status: "Pass", duration: "55m" },
            r3: { score: "Pass", status: "Completed", duration: "12m", aiSummary: "Candidate demonstrated strong communication skills and clear technical reasoning. Effectively explained complex React concepts." }
        },
        flags: []
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/assessments/${params.id}/results`}>
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{candidate.email}</span>
                            <span>•</span>
                            <span>{candidate.role}</span>
                            <span>•</span>
                            <span>Applied {candidate.appliedDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-sm py-1 px-3">
                        {candidate.status}
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

                            {/* Round 1 Node */}
                            <div className="flex flex-col items-center gap-2 bg-background p-2">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 border-4 border-white shadow-sm">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-foreground">MCQ</p>
                                    <p className="text-[10px] text-muted-foreground">{candidate.rounds.r1.score}% / {candidate.rounds.r1.status}</p>
                                </div>
                            </div>

                            {/* Round 2 Node */}
                            <div className="flex flex-col items-center gap-2 bg-background p-2">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 border-4 border-white shadow-sm">
                                    <Code className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-foreground">Coding</p>
                                    <p className="text-[10px] text-muted-foreground">{candidate.rounds.r2.score}% / {candidate.rounds.r2.status}</p>
                                </div>
                            </div>

                            {/* Round 3 Node */}
                            <div className="flex flex-col items-center gap-2 bg-background p-2">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 border-4 border-white shadow-sm">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-foreground">AI Video</p>
                                    <p className="text-[10px] text-muted-foreground">{candidate.rounds.r3.status}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-2">
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Score</div>
                        <div className="text-6xl font-bold tracking-tighter text-foreground">{candidate.overallScore}</div>
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">Top 10%</Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold tracking-tight">Round-wise Breakdown</h3>

                {/* Round 1 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-base">Round 1: Technical MCQ</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">Duration: {candidate.rounds.r1.duration}</div>
                            <div className="text-xl font-bold">{candidate.rounds.r1.score}%</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-[95%]" />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>HTML/CSS: 100%</span>
                            <span>JavaScript: 92%</span>
                            <span>React: 95%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Round 2 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <Code className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-base">Round 2: Hands-on Coding</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">Duration: {candidate.rounds.r2.duration}</div>
                            <div className="text-xl font-bold">{candidate.rounds.r2.score}%</div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">Problem 1: Array Manipulation</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700">Passed</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">Time Complexity: O(n) • Space Complexity: O(1)</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Round 3 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Video className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-base">Round 3: AI Video Interview</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">Duration: {candidate.rounds.r3.duration}</div>
                            <div className="text-xl font-bold text-green-600">Pass</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100 flex gap-3">
                            <div className="mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-purple-900">AI Summary</p>
                                <p className="text-sm text-purple-800 leading-relaxed">
                                    {candidate.rounds.r3.aiSummary}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Proctoring */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-muted-foreground" /> Proctoring Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>No suspicious activity detected during the session.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
