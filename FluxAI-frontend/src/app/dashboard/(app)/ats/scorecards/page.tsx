"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { ClipboardList, Plus, FileText } from "lucide-react"

interface Scorecard {
    _id: string
    title: string
    jobId?: string
    sections: any[]
    createdAt: string
}

export default function ScorecardsPage() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['scorecards'],
        queryFn: () => apiClient.get<Scorecard[]>('/scorecards'),
    })

    const scorecards = response?.data || []

    return (
        <PageContainer title="Scorecards" description="Create and manage interview scorecards for structured evaluations.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                <div className="flex items-center justify-end">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> Create Scorecard
                    </button>
                </div>

                {isLoading && (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                    </div>
                )}

                {!isLoading && scorecards.length === 0 && (
                    <EmptyState
                        icon={ClipboardList}
                        title="No scorecards created"
                        description="Create scorecards to standardize your interview evaluation process."
                        actionLabel="Create Scorecard"
                    />
                )}

                {!isLoading && scorecards.length > 0 && (
                    <div className="space-y-3">
                        {scorecards.map(sc => (
                            <div key={sc._id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{sc.title}</p>
                                        <p className="text-[10px] text-muted-foreground">{sc.sections?.length || 0} sections</p>
                                    </div>
                                </div>
                                <Badge className="text-[10px] bg-muted/50 text-muted-foreground">
                                    {new Date(sc.createdAt).toLocaleDateString()}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
