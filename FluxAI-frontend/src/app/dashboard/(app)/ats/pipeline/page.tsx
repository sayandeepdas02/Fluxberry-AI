"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { useKanbanStore } from "@/lib/store/kanban-store"
import { useQuery } from "@tanstack/react-query"
import { jobsApi } from "@/lib/api/jobs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KanbanBoard } from "@/components/dashboard/ats/kanban-board"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function PipelinePage() {
    const { selectedJobId, setSelectedJobId } = useKanbanStore()

    const { data: jobsResponse, isLoading: isLoadingJobs } = useQuery({
        queryKey: ['jobs', 'active'],
        queryFn: () => jobsApi.list({ status: 'PUBLISHED' }) // assuming we want active jobs
    })

    const jobs = jobsResponse?.data || []

    // Auto-select first job if none selected
    useEffect(() => {
        if (!selectedJobId && jobs.length > 0) {
            setSelectedJobId(jobs[0]._id)
        }
    }, [jobs, selectedJobId, setSelectedJobId])

    return (
        <PageContainer
            title="ATS Pipeline"
            description="Manage candidates across your hiring process via drag and drop."
        >
            <div className="flex flex-col h-full mt-6 space-y-6">
                <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-muted-foreground">Select Job:</p>
                    {isLoadingJobs ? (
                        <div className="h-10 w-64 bg-muted/50 animate-pulse rounded-md"></div>
                    ) : (
                        <Select value={selectedJobId || undefined} onValueChange={setSelectedJobId}>
                            <SelectTrigger className="w-80 bg-card">
                                <SelectValue placeholder="Choose a job pipeline..." />
                            </SelectTrigger>
                            <SelectContent>
                                {jobs.map((job: any) => (
                                    <SelectItem key={job._id} value={job._id}>
                                        {job.title} {job.department ? `(${job.department})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex-1 w-full bg-background rounded-lg border border-line p-4 overflow-hidden flex flex-col relative">
                    {!selectedJobId ? (
                        <div className="m-auto text-center">
                            <p className="text-muted-foreground">Select a job from the dropdown to view its pipeline.</p>
                        </div>
                    ) : (
                        <ErrorBoundary section="ATS Pipeline">
                            <KanbanBoard jobId={selectedJobId} />
                        </ErrorBoundary>
                    )}
                </div>
            </div>
        </PageContainer>
    )
}
