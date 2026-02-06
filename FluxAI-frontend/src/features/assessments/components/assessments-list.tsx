"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, CheckCircle2, Copy, Loader2, MoreHorizontal, ArrowRight, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { useAssessments } from "@/lib/hooks/use-assessments"
import { formatDistanceToNow } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Fallback mock data when API is not available
const mockAssessments = [
    {
        id: "101",
        title: "Senior Frontend Engineer",
        description: "Technical assessment for Senior React Developer role focusing on system design and performance.",
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
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        updatedAt: new Date().toISOString(),
    },
    {
        id: "102",
        title: "Backend Developer (Go)",
        description: "Evaluate Go proficiency, concurrency patterns, and API design skills.",
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
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "103",
        title: "Full Stack Internship 2024",
        description: "Comprehensive assessment covering basic frontend, node.js backend, and problem solving.",
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
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
    },
]

export function AssessmentsList() {
    const { assessments: apiAssessments, isLoading, error } = useAssessments()

    // Use API data if available, else fallback to mock
    const assessments = apiAssessments.length > 0 ? apiAssessments : mockAssessments

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default' // Primary/Black usually
            case 'DRAFT': return 'secondary' // Gray
            case 'ARCHIVED': return 'outline'
            case 'PAUSED': return 'destructive'
            default: return 'outline'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800'
            case 'DRAFT': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800'
            case 'ARCHIVED': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            case 'PAUSED': return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800'
            default: return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Active'
            case 'DRAFT': return 'Draft'
            case 'PAUSED': return 'Paused'
            case 'ARCHIVED': return 'Archived'
            default: return status.charAt(0) + status.slice(1).toLowerCase()
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Assessments</h1>
                    <p className="text-base text-muted-foreground/80 max-w-2xl">
                        Manage your hiring pipelines, track candidate progress, and analyze results.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="lg" className="gap-2 shadow-sm font-medium" asChild>
                        <Link href="/dashboard/assessments/new">
                            <Plus className="w-4 h-4" /> New Assessment
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                    <p className="text-muted-foreground text-sm">Loading assessments...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 dark:border-orange-900/30 dark:bg-orange-900/10 dark:text-orange-300">
                    <p className="text-sm font-medium">Viewing demo data. Connect to backend for live updates.</p>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!isLoading && assessments.map((assessment) => (
                    <Card key={assessment.id} className="group relative flex flex-col overflow-hidden border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-md transition-all duration-300">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300
                            ${assessment.status === 'ACTIVE' ? 'bg-emerald-500' :
                                assessment.status === 'DRAFT' ? 'bg-amber-400' :
                                    assessment.status === 'ARCHIVED' ? 'bg-slate-300' : 'bg-primary'
                            }`}
                        />

                        <CardHeader className="p-5 pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(assessment.status)}`}>
                                    {getStatusLabel(assessment.status)}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                            <span className="sr-only">Menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/assessments/new?duplicate=${assessment.id}`} className="cursor-pointer">
                                                <Copy className="w-4 h-4 mr-2" /> Duplicate
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/assessments/${assessment.id}/configure`} className="cursor-pointer">
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="space-y-1.5 pt-2">
                                <h3 className="font-semibold text-lg leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                                    <Link href={`/dashboard/assessments/${assessment.id}/results`} className="before:absolute before:inset-0">
                                        {assessment.title}
                                    </Link>
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                    {assessment.description || `Assessment for ${assessment.title}`}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 pt-2 mt-auto space-y-4">
                            {/* Badges/Tags */}
                            <div className="flex flex-wrap gap-1.5">
                                {assessment.rounds.filter(r => r.enabled).slice(0, 3).map((round) => (
                                    <span key={round.id} className="inline-flex items-center px-2 py-1 rounded bg-secondary/50 text-[10px] font-medium text-secondary-foreground uppercase tracking-wider border border-secondary/20">
                                        {round.roundType}
                                    </span>
                                ))}
                                {(assessment.rounds.filter(r => r.enabled).length > 3) && (
                                    <span className="inline-flex items-center px-1.5 py-1 text-[10px] text-muted-foreground">
                                        +{assessment.rounds.filter(r => r.enabled).length - 3} more
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5" title="Candidates Invited">
                                        <Users className="w-3.5 h-3.5" />
                                        <span className="font-medium text-foreground/80">{assessment.candidateCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Completed">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span className="font-medium text-foreground/80">{assessment.completedCount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-80">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatDistanceToNow(new Date(assessment.createdAt), { addSuffix: true })}</span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="pt-2 flex items-center gap-2 relative z-10">
                                {assessment.status === 'DRAFT' ? (
                                    <Button size="sm" variant="outline" className="w-full justify-between group/btn hover:border-primary/50 hover:bg-primary/5" asChild>
                                        <Link href={`/dashboard/assessments/${assessment.id}/configure`}>
                                            Continue Setup
                                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button size="sm" variant="secondary" className="w-full justify-between group/btn hover:bg-secondary/80" asChild>
                                        <Link href={`/dashboard/assessments/${assessment.id}/results`}>
                                            View Results
                                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-foreground transition-colors" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State / Create New Card (Optional, or just keep the top button) */}
                {/* We could add a "New Assessment" card here if desired, but top button is usually enough. */}
            </div>
        </div>
    )
}
