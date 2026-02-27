"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { atsScreeningApi } from "@/lib/api/ats-screening"
import { jobsApi } from "@/lib/api/jobs"
import { AtsOverviewPanel } from "../components/ats-overview-panel"
import { AtsScoreHistogram } from "../components/ats-score-histogram"
import { AtsCandidateTable } from "../components/ats-candidate-table"
import { AtsBreakdownModal } from "../components/ats-breakdown-modal"
import { AtsSettingsModal } from "../components/ats-settings-modal"
import { getCookie } from "cookies-next"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AtsDashboardPageProps {
    jobId: string
}

export function AtsDashboardPage({ jobId }: AtsDashboardPageProps) {
    const orgId = getCookie('organizationId') as string

    // States
    const [page, setPage] = useState(1)
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Fetch Job Info
    const { data: jobInfo, isLoading: isJobLoading } = useSWR(
        jobId ? `job-${jobId}` : null,
        () => jobsApi.getById(jobId)
    )

    // Fetch Stats (Polling every 10s if screening in progress, else slower)
    const { data: stats, isLoading: isStatsLoading } = useSWR(
        jobId ? `ats-stats-${jobId}` : null,
        () => atsScreeningApi.getJobStats(jobId),
        { refreshInterval: 10000 }
    )

    // Fetch Candidates List
    const { data: candidatesRes, isLoading: isCandidatesLoading } = useSWR(
        jobId ? `ats-candidates-${jobId}-${page}` : null,
        () => atsScreeningApi.getCandidates(jobId, page, 20),
        { refreshInterval: 10000 }
    )

    // Fetch Breakdown when modal opens
    const { data: breakdownRaw, isLoading: isBreakdownLoading } = useSWR(
        selectedCandidateId ? `ats-breakdown-${selectedCandidateId}` : null,
        () => atsScreeningApi.getCandidateBreakdown(jobId, selectedCandidateId!)
    )

    const handleOpenBreakdown = useCallback((id: string) => {
        setSelectedCandidateId(id)
        setIsModalOpen(true)
    }, [])

    const handleModalClose = useCallback((open: boolean) => {
        setIsModalOpen(open)
        if (!open) {
            // small delay to let exit animation finish before unmounting data
            setTimeout(() => setSelectedCandidateId(null), 300)
        }
    }, [])

    if (isJobLoading || isStatsLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading ATS Dashboard...</div>
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ATS Screening</h1>
                    <p className="text-muted-foreground mt-1">
                        AI-driven candidate intelligence and ranking for {jobInfo?.data?.title || 'Job'}
                    </p>
                </div>
                <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
            </div>

            {/* Overview Panel */}
            {stats?.data && <AtsOverviewPanel overview={stats.data.overview} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Histogram */}
                {stats?.data && <AtsScoreHistogram data={stats.data.histogram} percentiles={stats.data.percentiles} />}

                {/* Optional logic panel: Action items or pipeline charts could go here next to histogram */}
            </div>

            {/* Candidate Table */}
            <div>
                <h3 className="text-lg font-medium mb-4 tracking-tight">Ranked Candidates</h3>
                <AtsCandidateTable
                    jobId={jobId}
                    candidates={candidatesRes?.data?.data || []}
                    isLoading={isCandidatesLoading}
                    onOpenBreakdown={handleOpenBreakdown}
                />
            </div>

            {/* Breakdown Modal */}
            <AtsBreakdownModal
                isOpen={isModalOpen}
                onOpenChange={handleModalClose}
                data={breakdownRaw || null}
                isLoading={isBreakdownLoading}
            />

            {/* Settings Modal */}
            <AtsSettingsModal
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                jobId={jobId}
            />

        </div>
    )
}
