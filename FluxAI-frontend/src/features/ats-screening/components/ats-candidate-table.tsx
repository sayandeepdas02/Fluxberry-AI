"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PremiumEmptyState } from "@/components/ui/empty-state"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AtsCandidate, atsScreeningApi } from "@/lib/api/ats-screening"
import { RadarIcon, ChevronDown, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

interface AtsCandidateTableProps {
    jobId: string
    candidates: AtsCandidate[]
    isLoading: boolean
    onOpenBreakdown: (candidateId: string) => void
}

export function AtsCandidateTable({ jobId, candidates, isLoading, onOpenBreakdown }: AtsCandidateTableProps) {
    const [overridingId, setOverridingId] = useState<string | null>(null)

    const handleOverride = async (candidateId: string, decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED') => {
        setOverridingId(candidateId)
        try {
            const res = await atsScreeningApi.overrideDecision(jobId, candidateId, decision, 'Manual UI override')
            toast.success(`Candidate marked as ${decision.toLowerCase()}`)
            // Typically SWR polling will auto-refresh, but we could trigger mutate if needed
        } catch (error) {
            toast.error("Failed to override decision")
        } finally {
            setOverridingId(null)
        }
    }

    const getScoreColorClass = (score: number) => {
        if (score >= 80) return "text-green-600 font-semibold"
        if (score >= 60) return "text-yellow-600 font-semibold"
        return "text-red-600 font-medium"
    }

    const getDecisionBadge = (decision: string, inProgress: boolean) => {
        if (inProgress) return <Badge variant="outline" className="animate-pulse rounded-full px-3 py-1 font-medium">Screening...</Badge>
        switch (decision) {
            case 'SHORTLISTED': return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border border-emerald-500/20 rounded-full px-3 py-1 font-semibold">Shortlisted</Badge>
            case 'REVIEW': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border border-amber-500/20 rounded-full px-3 py-1 font-semibold">Needs Review</Badge>
            case 'REJECTED': return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 shadow-none border border-rose-500/20 rounded-full px-3 py-1 font-semibold">Rejected</Badge>
            case 'ERROR': return <Badge variant="destructive" className="rounded-full px-3 py-1 font-semibold">Error</Badge>
            default: return <Badge variant="outline" className="rounded-full px-3 py-1 font-medium">Pending</Badge>
        }
    }

    if (isLoading && candidates.length === 0) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading candidates...</div>
    }

    if (candidates.length === 0) {
        return (
            <PremiumEmptyState 
                title="No screening data"
                description="Waiting for candidates to apply. AI will automatically evaluate resumes based on your configured rubric."
                actionLabel="Analyze Resumes with AI"
                onAction={() => {}}
            />
        );
    }

    return (
        <div className="rounded-none border border-line bg-background overflow-hidden shadow-none">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.map((candidate) => {
                        const isPending = candidate.status === 'PENDING'
                        return (
                            <TableRow key={candidate.id} className="hover:bg-muted/30 group transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                            {candidate.name ? candidate.name[0] : 'U'}
                                        </div>
                                        <span className="font-semibold text-foreground">{candidate.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={isPending ? "text-muted-foreground" : getScoreColorClass(candidate.score)}>
                                        {isPending ? '-' : candidate.score}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {isPending ? '-' : `${candidate.confidence}%`}
                                </TableCell>
                                <TableCell>
                                    {getDecisionBadge(candidate.decision, isPending)}
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onOpenBreakdown(candidate.id)}
                                        disabled={isPending}
                                        title="View Score Breakdown"
                                    >
                                        <RadarIcon className="h-4 w-4 mr-1" />
                                        Breakdown
                                    </Button>
                                    {/* Action Hook for overriding, e.g. move to next stage manually */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={isPending || overridingId === candidate.id}>
                                                {overridingId === candidate.id ? 'Saving...' : 'Override'}
                                                <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOverride(candidate.id, 'SHORTLISTED')}>
                                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Mark Shortlisted
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOverride(candidate.id, 'REVIEW')}>
                                                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" /> Needs Review
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOverride(candidate.id, 'REJECTED')}>
                                                <XCircle className="h-4 w-4 mr-2 text-red-600" /> Mark Rejected
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
