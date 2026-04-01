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
import { AtsCandidate, atsScreeningApi, ScreeningStatus } from "@/lib/api/ats-screening"
import {
    RadarIcon,
    ChevronDown,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Crown,
    BarChart4,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useCallback } from "react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PaginationInfo {
    total: number
    page: number
    pages: number
    limit: number
}

interface AtsCandidateTableProps {
    jobId: string
    candidates: AtsCandidate[]
    isLoading: boolean
    pagination?: PaginationInfo
    onOpenBreakdown: (candidateId: string) => void
    onNextPage?: () => void
    onPrevPage?: () => void
    onRetry?: (candidateId: string) => void
    onCompare?: (ids: [string, string]) => void
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600 font-semibold"
    if (score >= 60) return "text-yellow-600 font-semibold"
    return "text-red-600 font-medium"
}

const isPendingStatus = (status: string) =>
    status === ScreeningStatus.PENDING ||
    status === ScreeningStatus.AWAITING_PARSE ||
    status === ScreeningStatus.SCORING_IN_PROGRESS

const isFailedParseStatus = (status: string) =>
    status === ScreeningStatus.PARSE_FAILED || status === ScreeningStatus.ERROR

const getDecisionBadge = (candidate: AtsCandidate) => {
    const { decision, status } = candidate

    if (status === ScreeningStatus.SCORING_IN_PROGRESS) {
        return (
            <Badge variant="outline" className="animate-pulse rounded-full px-3 py-1 font-medium gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Scoring...
            </Badge>
        )
    }

    if (status === ScreeningStatus.AWAITING_PARSE) {
        return (
            <Badge variant="outline" className="animate-pulse rounded-full px-3 py-1 font-medium gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Parsing...
            </Badge>
        )
    }

    if (status === ScreeningStatus.PARSE_FAILED) {
        const reason = candidate.errorReason === 'PARSE_TIMEOUT'
            ? 'Resume fetch timed out'
            : 'Invalid resume format'
        return (
            <Badge
                className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1 font-semibold gap-1.5 cursor-help"
                title={`${reason} — click Retry to re-process`}
            >
                <AlertTriangle className="h-3 w-3" />
                Parse Failed
            </Badge>
        )
    }

    if (status === ScreeningStatus.ERROR) {
        return (
            <Badge variant="destructive" className="rounded-full px-3 py-1 font-semibold">
                Error
            </Badge>
        )
    }

    switch (decision) {
        case 'SHORTLISTED':
            return (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border border-emerald-500/20 rounded-full px-3 py-1 font-semibold">
                    Shortlisted
                </Badge>
            )
        case 'REVIEW':
            return (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border border-amber-500/20 rounded-full px-3 py-1 font-semibold">
                    Needs Review
                </Badge>
            )
        case 'REJECTED':
            return (
                <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 shadow-none border border-rose-500/20 rounded-full px-3 py-1 font-semibold">
                    Rejected
                </Badge>
            )
        default:
            return (
                <Badge variant="outline" className="rounded-full px-3 py-1 font-medium">
                    Pending
                </Badge>
            )
    }
}

// ─────────────────────────────────────────────
// Score Tooltip Component
// ─────────────────────────────────────────────

function ScoreTooltip({ candidate }: { candidate: AtsCandidate }) {
    const isPending = isPendingStatus(candidate.status)
    const isFailed = isFailedParseStatus(candidate.status)

    if (isPending || isFailed) {
        return <span className="text-muted-foreground">—</span>
    }

    return (
        <div className="group relative inline-block">
            <span className={getScoreColorClass(candidate.score)}>
                {candidate.score}
            </span>

            {/* Mini breakdown on hover */}
            {candidate.scoreBreakdown && (
                <div className="absolute -top-2 left-full ml-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 min-w-[140px]">
                    <div className="font-semibold text-foreground mb-1.5">Score Breakdown</div>
                    <div className="space-y-1 text-muted-foreground">
                        <div className="flex justify-between gap-4">
                            <span>Skills</span>
                            <span className="font-medium text-foreground">{candidate.scoreBreakdown.skillScore}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Experience</span>
                            <span className="font-medium text-foreground">{candidate.scoreBreakdown.experienceScore}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Projects</span>
                            <span className="font-medium text-foreground">{candidate.scoreBreakdown.projectScore}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Education</span>
                            <span className="font-medium text-foreground">{candidate.scoreBreakdown.educationScore}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function AtsCandidateTable({
    jobId,
    candidates,
    isLoading,
    pagination,
    onOpenBreakdown,
    onNextPage,
    onPrevPage,
    onRetry,
    onCompare,
}: AtsCandidateTableProps) {
    const [overridingId, setOverridingId] = useState<string | null>(null)
    const [retryingId, setRetryingId]   = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkProcessing, setBulkProcessing] = useState(false)

    const handleOverride = async (candidateId: string, decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED') => {
        setOverridingId(candidateId)
        try {
            await atsScreeningApi.overrideDecision(jobId, candidateId, decision, 'Manual UI override')
            toast.success(`Candidate marked as ${decision.toLowerCase()}`)
        } catch {
            toast.error("Failed to override decision")
        } finally {
            setOverridingId(null)
        }
    }

    const handleRetry = async (candidateId: string) => {
        setRetryingId(candidateId)
        try {
            await atsScreeningApi.retryParseFailed(jobId, candidateId)
            toast.success("Retry queued — results will update in a few seconds")
            onRetry?.(candidateId)
        } catch {
            toast.error("Failed to queue retry")
        } finally {
            setRetryingId(null)
        }
    }

    // ── Bulk Actions ──

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const toggleSelectAll = useCallback(() => {
        const scoredCandidates = candidates.filter(c => !isPendingStatus(c.status) && !isFailedParseStatus(c.status))
        if (selectedIds.size === scoredCandidates.length && scoredCandidates.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(scoredCandidates.map(c => c.id)))
        }
    }, [candidates, selectedIds])

    const handleBulkAction = async (decision: 'SHORTLISTED' | 'REJECTED') => {
        if (selectedIds.size === 0) return
        setBulkProcessing(true)
        try {
            await atsScreeningApi.bulkOverride(jobId, Array.from(selectedIds), decision, `Bulk ${decision.toLowerCase()}`)
            toast.success(`${selectedIds.size} candidates marked as ${decision.toLowerCase()}`)
            setSelectedIds(new Set())
        } catch {
            toast.error("Failed to process bulk action")
        } finally {
            setBulkProcessing(false)
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
        )
    }

    // Pagination derived values
    const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1
    const endItem   = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : candidates.length
    const canGoPrev = pagination ? pagination.page > 1 : false
    const canGoNext = pagination ? pagination.page < pagination.pages : false

    const scoredCandidates = candidates.filter(c => !isPendingStatus(c.status) && !isFailedParseStatus(c.status))
    const allScoredSelected = scoredCandidates.length > 0 && selectedIds.size === scoredCandidates.length

    return (
        <div className="rounded-none border border-line bg-background overflow-hidden shadow-none">

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b border-primary/20">
                    <span className="text-sm font-medium text-foreground">
                        {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                            onClick={() => handleBulkAction('SHORTLISTED')}
                            disabled={bulkProcessing}
                        >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {bulkProcessing ? 'Processing...' : 'Bulk Shortlist'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                            onClick={() => handleBulkAction('REJECTED')}
                            disabled={bulkProcessing}
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            {bulkProcessing ? 'Processing...' : 'Bulk Reject'}
                        </Button>
                        {selectedIds.size === 2 && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1 ml-2"
                                onClick={() => {
                                    const ids = Array.from(selectedIds)
                                    if (onCompare) onCompare([ids[0], ids[1]])
                                }}
                            >
                                <BarChart4 className="h-3.5 w-3.5" />
                                Compare Candidates
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <input
                                type="checkbox"
                                checked={allScoredSelected}
                                onChange={toggleSelectAll}
                                className="rounded border-border cursor-pointer"
                            />
                        </TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.map((candidate) => {
                        const isPending = isPendingStatus(candidate.status)
                        const isFailedParse = isFailedParseStatus(candidate.status)
                        const canSelect = !isPending && !isFailedParse

                        return (
                            <TableRow key={candidate.id} className={`hover:bg-muted/30 group transition-colors ${selectedIds.has(candidate.id) ? 'bg-primary/5' : ''}`}>
                                <TableCell>
                                    {canSelect ? (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(candidate.id)}
                                            onChange={() => toggleSelect(candidate.id)}
                                            className="rounded border-border cursor-pointer"
                                        />
                                    ) : (
                                        <span className="w-4 h-4 inline-block" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-none border border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-xs shrink-0">
                                            {candidate.name ? candidate.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{candidate.name}</span>
                                            {/* Top 10 Badge */}
                                            {candidate.isTop10 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25" title="Top 10 candidate">
                                                    <Crown className="h-3 w-3" />
                                                    TOP
                                                </span>
                                            )}
                                            {/* Override Badge */}
                                            {candidate.isOverridden && (
                                                <span
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 cursor-help"
                                                    title={candidate.overrideReason
                                                        ? `Override: ${candidate.overrideReason}${candidate.overrideAt ? ` • ${new Date(candidate.overrideAt).toLocaleDateString()}` : ''}`
                                                        : 'Manually overridden'
                                                    }
                                                >
                                                    ★ Override
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <ScoreTooltip candidate={candidate} />
                                </TableCell>

                                <TableCell>
                                    {isPending || isFailedParse ? '—' : `${candidate.confidence}%`}
                                </TableCell>

                                <TableCell>
                                    {getDecisionBadge(candidate)}
                                </TableCell>

                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">

                                        {/* Retry button — only shown for PARSE_FAILED / ERROR */}
                                        {isFailedParse ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRetry(candidate.id)}
                                                disabled={retryingId === candidate.id}
                                                className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                            >
                                                {retryingId === candidate.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                )}
                                                {retryingId === candidate.id ? 'Queuing...' : 'Retry Parse'}
                                            </Button>
                                        ) : (
                                            <>
                                                {/* Breakdown button */}
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

                                                {/* Override dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={isPending || overridingId === candidate.id}
                                                        >
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
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {/* ── Pagination Footer ─────────────────────────────────────────── */}
            {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{" "}
                        <span className="font-medium text-foreground">{pagination.total}</span> candidates
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrevPage}
                            disabled={!canGoPrev || isLoading}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                        </Button>
                        <span className="text-sm font-medium text-foreground px-2">
                            {pagination.page} / {pagination.pages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNextPage}
                            disabled={!canGoNext || isLoading}
                            aria-label="Next page"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
