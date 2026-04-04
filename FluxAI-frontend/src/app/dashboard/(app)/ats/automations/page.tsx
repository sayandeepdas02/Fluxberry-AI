"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { Zap, CheckCircle, Clock, ArrowRight, Loader2 } from "lucide-react"

interface Workflow {
    _id: string
    name: string
    description?: string
    trigger: string
    status: 'active' | 'inactive' | 'draft'
    steps: any[]
    lastRun?: string
    createdAt: string
}

export default function AutomationsPage() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => apiClient.get<Workflow[]>('/workflows'),
    })

    const workflows = response?.data || []

    return (
        <PageContainer title="Automations" description="Automate repetitive hiring tasks with workflow automation.">
            <div className="mt-6 w-full space-y-6">
                {isLoading && (
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
                )}

                {!isLoading && workflows.length === 0 && (
                    <EmptyState
                        icon={Zap}
                        title="No automations set up"
                        description="Create automations to streamline candidate screening, email follow-ups, and stage transitions."
                        actionLabel="Create Automation"
                    />
                )}

                {!isLoading && workflows.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</p>
                        {workflows.map(wf => (
                            <div key={wf._id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${wf.status === 'active' ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                                        <Zap className={`w-4 h-4 ${wf.status === 'active' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{wf.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{wf.trigger} · {wf.steps?.length || 0} steps</p>
                                    </div>
                                </div>
                                <Badge className={`text-[10px] ${wf.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                    {wf.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
