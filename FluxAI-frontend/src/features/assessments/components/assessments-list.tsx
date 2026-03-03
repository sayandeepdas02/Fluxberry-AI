"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, CheckCircle2, Copy, Loader2, MoreHorizontal, ArrowRight, Clock, Briefcase, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAssessments } from "@/lib/hooks/use-assessments"
import { assessmentsApi } from "@/lib/api/assessments"
import { formatDistanceToNow } from "date-fns"
import { useState, useRef, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Clone (Rename) Dialog ─────────────────────────────────────────────
interface CloneDialogProps {
    assessmentTitle: string
    onConfirm: (title: string) => Promise<void>
    onClose: () => void
}

function CloneDialog({ assessmentTitle, onConfirm, onClose }: CloneDialogProps) {
    const [title, setTitle] = useState(`Copy of ${assessmentTitle}`)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.select()
    }, [])

    async function handleConfirm(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return
        setIsSaving(true)
        setError(null)
        try {
            await onConfirm(title.trim())
        } catch (err: any) {
            setError(err.message ?? 'Failed to clone assessment')
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Copy className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Clone Assessment</h2>
                            <p className="text-xs text-muted-foreground">All round configurations will be copied</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleConfirm} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">New Assessment Name</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter a name for the cloned assessment"
                            className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                        />
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>

                    <div className="bg-muted/40 border border-border/50 rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">What gets copied:</p>
                        <ul className="space-y-1 ml-2">
                            <li>✓ All round types and configurations</li>
                            <li>✓ MCQ question selections</li>
                            <li>✓ DSA questions and AI settings</li>
                            <li className="text-muted-foreground/70">✗ Candidate invites and results</li>
                        </ul>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSaving || !title.trim()}
                            className="gap-2"
                        >
                            {isSaving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cloning…</>
                                : <><Copy className="w-3.5 h-3.5" /> Clone Assessment</>
                            }
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Main List Component ───────────────────────────────────────────────
export function AssessmentsList() {
    const { assessments, isLoading, error, refetch } = useAssessments()
    const router = useRouter()

    const [cloningAssessment, setCloningAssessment] = useState<{ id: string; title: string } | null>(null)

    async function handleClone(id: string, title: string) {
        await assessmentsApi.clone(id, title)
        if (typeof refetch === 'function') refetch()
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
            {/* Clone Dialog */}
            {cloningAssessment && (
                <CloneDialog
                    assessmentTitle={cloningAssessment.title}
                    onClose={() => setCloningAssessment(null)}
                    onConfirm={async (title) => {
                        const response = await assessmentsApi.clone(cloningAssessment.id, title)
                        if (!response.success || !response.data) {
                            throw new Error(response.error?.message ?? 'Failed to clone assessment')
                        }
                        setCloningAssessment(null)
                        refetch()
                        // Navigate to configure the new clone immediately
                        router.push(`/dashboard/assessments/${response.data.id}/configure`)
                    }}
                />
            )}

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
                    <p className="text-sm font-medium">Could not load assessments. Check your connection and try again.</p>
                </div>
            )}

            {!isLoading && assessments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-lg border border-dashed border-border bg-muted/20">
                    <Briefcase className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">No assessments yet</p>
                    <p className="text-sm text-muted-foreground/80 text-center max-w-sm">Create your first assessment to start screening candidates.</p>
                    <Button asChild>
                        <Link href="/dashboard/assessments/new">New Assessment</Link>
                    </Button>
                </div>
            )}

            {/* Grid */}
            {!isLoading && assessments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
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
                                            {/* Clone — opens rename dialog */}
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => setCloningAssessment({ id: assessment.id, title: assessment.title })}
                                            >
                                                <Copy className="w-4 h-4 mr-2" /> Clone
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
                                {/* Round badges */}
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
                </div>
            )}
        </div>
    )
}
