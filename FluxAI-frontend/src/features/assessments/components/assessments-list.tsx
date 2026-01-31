"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, CheckCircle2, Copy, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAssessments } from "@/lib/hooks/use-assessments"

// Fallback mock data when API is not available
const mockAssessments = [
    {
        id: "101",
        title: "Senior Frontend Engineer",
        description: "Frontend assessment",
        status: "ACTIVE" as const,
        slug: "senior-frontend",
        passingScore: 70,
        timeLimit: 60,
        allowedAttempts: 1,
        shuffleQuestions: false,
        showResults: true,
        proctoringEnabled: true,
        rounds: [
            { id: "1", roundType: "MCQ" as const, order: 1, enabled: true, timeLimit: 30, config: {} },
            { id: "2", roundType: "DSA" as const, order: 2, enabled: true, timeLimit: 30, config: {} },
        ],
        candidateCount: 124,
        completedCount: 86,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "102",
        title: "Backend Developer (Go)",
        description: "Backend assessment",
        status: "DRAFT" as const,
        slug: "backend-go",
        passingScore: 70,
        timeLimit: 45,
        allowedAttempts: 1,
        shuffleQuestions: false,
        showResults: true,
        proctoringEnabled: true,
        rounds: [
            { id: "3", roundType: "DSA" as const, order: 1, enabled: true, timeLimit: 45, config: {} },
        ],
        candidateCount: 0,
        completedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "103",
        title: "Full Stack Internship 2024",
        description: "Intern assessment",
        status: "ARCHIVED" as const,
        slug: "fullstack-intern-2024",
        passingScore: 60,
        timeLimit: 90,
        allowedAttempts: 1,
        shuffleQuestions: true,
        showResults: true,
        proctoringEnabled: true,
        rounds: [
            { id: "4", roundType: "MCQ" as const, order: 1, enabled: true, timeLimit: 30, config: {} },
            { id: "5", roundType: "DSA" as const, order: 2, enabled: true, timeLimit: 30, config: {} },
            { id: "6", roundType: "AI" as const, order: 3, enabled: true, timeLimit: 30, config: {} },
        ],
        candidateCount: 850,
        completedCount: 720,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
]

export function AssessmentsList() {
    const { assessments: apiAssessments, isLoading, error } = useAssessments()

    // Use API data if available, else fallback to mock
    const assessments = apiAssessments.length > 0 ? apiAssessments : mockAssessments

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default'
            case 'DRAFT': return 'secondary'
            default: return 'outline'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Active'
            case 'DRAFT': return 'Draft'
            case 'PAUSED': return 'Paused'
            case 'ARCHIVED': return 'Closed'
            default: return status
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage technical interview campaigns and track candidate performance.
                    </p>
                </div>
                <Button size="sm" className="gap-2" asChild>
                    <Link href="/dashboard/assessments/new">
                        <Plus className="w-4 h-4" /> Create Assessment
                    </Link>
                </Button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {error && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Using demo data. Connect to backend for live data.</p>
                </div>
            )}

            <div className="grid gap-4">
                {assessments.map((assessment) => (
                    <Card key={assessment.id} className="hover:border-foreground/20 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg hover:underline decoration-1 underline-offset-4 cursor-pointer">
                                                <Link href={`/dashboard/assessments/${assessment.id}/results`}>{assessment.title}</Link>
                                            </h3>
                                            <Badge variant={getStatusVariant(assessment.status)} className="rounded-full">
                                                {getStatusLabel(assessment.status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {assessment.description || `Assessment for ${assessment.title}`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {assessment.rounds.filter(r => r.enabled).map((round) => (
                                            <Badge key={round.id} variant="outline" className="text-xs font-mono bg-muted/50">
                                                {round.roundType}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span className="font-medium text-foreground">{assessment.candidateCount || 0}</span> Invited
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium text-foreground">{assessment.completedCount || 0}</span> Completed
                                    </div>
                                    {assessment.status === 'DRAFT' ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Duplicate" asChild>
                                                <Link href={`/dashboard/assessments/new?duplicate=${assessment.id}`}>
                                                    <Copy className="w-4 h-4 text-neutral-500" />
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/dashboard/assessments/${assessment.id}/configure`}>
                                                    Continue Setup
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Duplicate" asChild>
                                                <Link href={`/dashboard/assessments/new?duplicate=${assessment.id}`}>
                                                    <Copy className="w-4 h-4 text-neutral-500" />
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link href={`/dashboard/assessments/${assessment.id}/results`}>
                                                    View Results
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
