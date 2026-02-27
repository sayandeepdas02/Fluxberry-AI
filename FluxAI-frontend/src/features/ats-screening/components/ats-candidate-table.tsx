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
        if (inProgress) return <Badge variant="outline" className="animate-pulse">Screening...</Badge>
        switch (decision) {
            case 'SHORTLISTED': return <Badge className="bg-green-500 hover:bg-green-600">Shortlisted</Badge>
            case 'REVIEW': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Needs Review</Badge>
            case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
            case 'ERROR': return <Badge variant="destructive">Error</Badge>
            default: return <Badge variant="outline">Pending</Badge>
        }
    }

    if (isLoading && candidates.length === 0) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading candidates...</div>
    }

    if (candidates.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-md">No candidates have applied yet.</div>
    }

    return (
        <div className="rounded-md border bg-card">
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
                            <TableRow key={candidate.id}>
                                <TableCell className="font-medium">{candidate.name}</TableCell>
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
