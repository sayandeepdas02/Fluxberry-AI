"use client"

import { useState, useCallback } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { atsScreeningApi, AtsFilterParams } from "@/lib/api/ats-screening"
import { jobsApi } from "@/lib/api/jobs"
import { AtsOverviewPanel } from "../components/ats-overview-panel"
import { AtsScoreHistogram } from "../components/ats-score-histogram"
import { AtsCandidateTable } from "../components/ats-candidate-table"
import { AtsBreakdownModal } from "../components/ats-breakdown-modal"
import { AtsSettingsModal } from "../components/ats-settings-modal"
import { FilterToolbar } from "../components/filter-toolbar"
import { CopilotPanel } from "../components/copilot-panel"
import { CopilotQuestionsModal } from "../components/copilot-questions-modal"
import { CandidateComparisonModal } from "../components/candidate-comparison-modal"
import { getCookie } from "cookies-next"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AtsDashboardPageProps {
    jobId: string
}

export function AtsDashboardPage({ jobId }: AtsDashboardPageProps) {
    getCookie('organizationId') // org scope is enforced by JWT on the backend

    // ── State ─────────────────────────────────────────────────────────────
    const [page, setPage]                       = useState(1)
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen]         = useState(false)
    const [isSettingsOpen, setIsSettingsOpen]   = useState(false)
    const [filters, setFilters]                 = useState<AtsFilterParams>({})

    // Copilot questions modal state
    const [questionsOpen,          setQuestionsOpen]          = useState(false)
    const [questionsCandidateId,   setQuestionsCandidateId]   = useState<string | null>(null)
    const [questionsCandidateName, setQuestionsCandidateName] = useState<string | null>(null)

    // Compare modal state
    const [comparisonCandidates,   setComparisonCandidates]   = useState<[string, string] | null>(null)

    // ── Data Fetching ─────────────────────────────────────────────────────

    const { data: jobInfo, isLoading: isJobLoading } = useSWR(
        jobId ? `job-${jobId}` : null,
        () => jobsApi.getById(jobId)
    )

    // Poll every 10 s while screening is in-progress
    const { data: stats, isLoading: isStatsLoading } = useSWR(
        jobId ? `ats-stats-${jobId}` : null,
        () => atsScreeningApi.getJobStats(jobId),
        { refreshInterval: 10000 }
    )

    // Build filter key for SWR cache invalidation
    const filterKey = JSON.stringify(filters)

    // Re-fetches when `page` or `filters` change
    const candidatesKey = jobId ? `ats-candidates-${jobId}-page-${page}-f-${filterKey}` : null
    const { data: candidatesRes, isLoading: isCandidatesLoading } = useSWR(
        candidatesKey,
        () => atsScreeningApi.getCandidates(jobId, page, 20, filters),
        { refreshInterval: 10000, keepPreviousData: true }
    )

    // Fetch breakdown only when modal is open
    const { data: breakdownRaw, isLoading: isBreakdownLoading } = useSWR(
        selectedCandidateId ? `ats-breakdown-${selectedCandidateId}` : null,
        () => atsScreeningApi.getCandidateBreakdown(jobId, selectedCandidateId!)
    )

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleOpenBreakdown = useCallback((id: string) => {
        setSelectedCandidateId(id)
        setIsModalOpen(true)
    }, [])

    const handleModalClose = useCallback((open: boolean) => {
        setIsModalOpen(open)
        if (!open) {
            setTimeout(() => setSelectedCandidateId(null), 300)
        }
    }, [])

    const handleNextPage = useCallback(() => {
        setPage(prev => prev + 1)
    }, [])

    const handlePrevPage = useCallback(() => {
        setPage(prev => Math.max(1, prev - 1))
    }, [])

    /** Called after a retry-parse succeeds — invalidates both stats and candidates. */
    const handleRetry = useCallback(() => {
        globalMutate(`ats-stats-${jobId}`)
        globalMutate(candidatesKey)
    }, [jobId, candidatesKey])

    const handleFiltersChange = useCallback((newFilters: AtsFilterParams) => {
        setFilters(newFilters)
        setPage(1) // Reset to page 1 when filters change
    }, [])

    const handleGenerateQuestions = useCallback((candidateId: string, name: string) => {
        setQuestionsCandidateId(candidateId)
        setQuestionsCandidateName(name)
        setQuestionsOpen(true)
    }, [])

    // ── Loading State ─────────────────────────────────────────────────────

    if (isJobLoading || isStatsLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading ATS Dashboard...</div>
    }

    const pagination = candidatesRes?.data?.pagination

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl tracking-tight">ATS Screening</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-driven candidate intelligence and ranking for{" "}
                        {jobInfo?.data?.title || 'Job'}
                    </p>
                </div>
                <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
            </div>

            {/* AI Hiring Copilot — own fetch cycle, won't block candidate table */}
            <CopilotPanel
                jobId={jobId}
                onViewCandidate={handleOpenBreakdown}
                onGenerateQuestions={handleGenerateQuestions}
            />

            {/* Overview Panel */}
            {stats?.data && (
                <AtsOverviewPanel
                    overview={stats.data.overview}
                    avgScore={stats.data.avgScore}
                />
            )}

            {/* Histogram */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats?.data && (
                    <AtsScoreHistogram
                        data={stats.data.histogram}
                        percentiles={stats.data.percentiles}
                    />
                )}
            </div>

            {/* Candidate Table with Filters */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium tracking-tight">Ranked Candidates</h3>
                </div>
                <div className="mb-4">
                    <FilterToolbar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />
                </div>
                <AtsCandidateTable
                    jobId={jobId}
                    candidates={candidatesRes?.data?.data || []}
                    isLoading={isCandidatesLoading}
                    pagination={pagination}
                    onOpenBreakdown={handleOpenBreakdown}
                    onNextPage={handleNextPage}
                    onPrevPage={handlePrevPage}
                    onRetry={handleRetry}
                    onCompare={(ids) => setComparisonCandidates(ids)}
                />
            </div>

            {/* Score Breakdown Modal — now receives jobId for Copilot summary */}
            <AtsBreakdownModal
                isOpen={isModalOpen}
                onOpenChange={handleModalClose}
                data={breakdownRaw || null}
                isLoading={isBreakdownLoading}
                jobId={jobId}
                candidateId={selectedCandidateId}
                onGenerateQuestions={handleGenerateQuestions}
            />

            {/* Settings Modal */}
            <AtsSettingsModal
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                jobId={jobId}
            />

            {/* Copilot Interview Questions Modal */}
            <CopilotQuestionsModal
                isOpen={questionsOpen}
                onOpenChange={setQuestionsOpen}
                jobId={jobId}
                candidateId={questionsCandidateId}
                candidateName={questionsCandidateName}
            />

            {/* Candidate Comparison Modal */}
            <CandidateComparisonModal
                jobId={jobId}
                candidateIds={comparisonCandidates}
                onClose={() => setComparisonCandidates(null)}
            />
        </div>
    )
}
