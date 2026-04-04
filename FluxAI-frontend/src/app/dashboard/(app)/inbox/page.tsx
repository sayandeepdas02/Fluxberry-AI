"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { activityApi, ActivityLog } from "@/lib/api/activity"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import {
    Inbox, Bell, CheckCircle, Brain, UserPlus,
    Send, MailOpen, Loader2, Trash2, GitBranch,
    FileText, Briefcase, RefreshCw,
} from "lucide-react"
import { useState, useMemo } from "react"
import { formatDistanceToNow } from "date-fns"

// ── Event type mapping ───────────────────────────────────
const EVENT_CONFIG: Record<string, { icon: typeof Bell; color: string; label: string }> = {
    'CANDIDATE_CREATED': { icon: UserPlus, color: 'text-blue-400', label: 'Candidate Added' },
    'APPLICATION_CREATED': { icon: Send, color: 'text-purple-400', label: 'Application Received' },
    'STAGE_MOVED': { icon: GitBranch, color: 'text-amber-400', label: 'Pipeline Update' },
    'INTERVIEW_COMPLETED': { icon: CheckCircle, color: 'text-emerald-400', label: 'Interview Done' },
    'AI_SCREENING_COMPLETED': { icon: Brain, color: 'text-accent', label: 'AI Screening Complete' },
    'ASSESSMENT_SUBMITTED': { icon: FileText, color: 'text-sky-400', label: 'Assessment Submitted' },
    'JOB_CREATED': { icon: Briefcase, color: 'text-violet-400', label: 'Job Created' },
    'CAMPAIGN_REPLY': { icon: MailOpen, color: 'text-emerald-400', label: 'Campaign Reply' },
}

const DEFAULT_CONFIG = { icon: Bell, color: 'text-muted-foreground', label: 'Activity' }

function getEventConfig(eventType: string) {
    return EVENT_CONFIG[eventType] || DEFAULT_CONFIG
}

function formatEventMessage(log: ActivityLog): string {
    const meta = log.metadata || {}
    switch (log.eventType) {
        case 'CANDIDATE_CREATED':
            return `${meta.candidateName || 'A candidate'} was added${meta.source ? ` via ${meta.source}` : ''}.`
        case 'APPLICATION_CREATED':
            return `New application created${meta.jobTitle ? ` for ${meta.jobTitle}` : ''}.`
        case 'STAGE_MOVED':
            return `Candidate moved${meta.from ? ` from ${meta.from}` : ''} to ${meta.to || 'next stage'}.`
        case 'INTERVIEW_COMPLETED':
            return `Interview completed${meta.score ? ` with score ${meta.score}/100` : ''}.`
        case 'AI_SCREENING_COMPLETED':
            return `AI screening finished${meta.recommendation ? `. Recommendation: ${meta.recommendation}` : ''}.`
        case 'ASSESSMENT_SUBMITTED':
            return `Assessment submitted${meta.percentage ? ` — ${meta.percentage}%` : ''}.`
        case 'JOB_CREATED':
            return `Job "${meta.title || 'Untitled'}" was created.`
        case 'CAMPAIGN_REPLY':
            return `Prospect replied to outreach campaign.`
        default:
            return `${log.eventType.replace(/_/g, ' ').toLowerCase()} occurred.`
    }
}

export default function InboxPage() {
    const [filter, setFilter] = useState<'all' | 'ai' | 'pipeline'>('all')
    const [page, setPage] = useState(1)

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['activity-inbox', filter, page],
        queryFn: () => {
            const params: Record<string, any> = { page, limit: 20 }
            if (filter === 'ai') params.actorType = 'ai'
            if (filter === 'pipeline') params.entityType = 'application'
            return activityApi.list(params)
        },
        refetchInterval: 30000, // Poll every 30s for near-real-time updates
    })

    const logs = response?.data || []
    const meta = (response as any)?.meta || { total: 0 }

    const aiCount = useMemo(() => logs.filter(l => l.actorType === 'ai').length, [logs])

    return (
        <PageContainer title="Inbox" description="Real-time activity feed — all actions across your hiring pipeline.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                {/* Filter tabs */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {([
                            { key: 'all', label: `All (${meta.total || logs.length})` },
                            { key: 'ai', label: `AI Actions (${aiCount})` },
                            { key: 'pipeline', label: 'Pipeline' },
                        ] as const).map(tab => (
                            <button key={tab.key} onClick={() => { setFilter(tab.key); setPage(1) }}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    filter === tab.key ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground'
                                }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Auto-refresh every 30s
                    </p>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-line/50 bg-card/30">
                                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-64" />
                                    <Skeleton className="h-2 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <EmptyState
                        icon={Bell}
                        title="Failed to load activity"
                        description="There was a problem loading your activity feed. Please try refreshing."
                    />
                )}

                {/* Empty */}
                {!isLoading && !isError && logs.length === 0 && (
                    <EmptyState
                        icon={Inbox}
                        title={filter === 'all' ? 'No activity yet' : `No ${filter} activity`}
                        description="Activity will appear here as you create jobs, add candidates, and run interviews."
                    />
                )}

                {/* Activity feed */}
                {!isLoading && logs.length > 0 && (
                    <div className="space-y-2">
                        {logs.map(log => {
                            const config = getEventConfig(log.eventType)
                            const Icon = config.icon
                            const message = formatEventMessage(log)
                            const isAI = log.actorType === 'ai'

                            return (
                                <div key={log._id}
                                    className="flex items-start gap-3 p-4 rounded-lg border border-line/50 bg-card/30 hover:bg-card/50 transition-colors">
                                    <div className={`mt-0.5 shrink-0 ${config.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{config.label}</p>
                                            {isAI && <Badge className="bg-accent/10 text-accent text-[9px] px-1.5">AI</Badge>}
                                            <Badge className={`text-[9px] px-1.5 ${
                                                log.actorType === 'user' ? 'bg-blue-500/10 text-blue-400'
                                                : log.actorType === 'ai' ? 'bg-accent/10 text-accent'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>{log.actorType}</Badge>
                                        </div>
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{message}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-[10px] text-muted-foreground/50">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </p>
                                            {log.performedBy && (
                                                <p className="text-[10px] text-muted-foreground/50">
                                                    by {log.performedBy.firstName} {log.performedBy.lastName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && logs.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">Page {page}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 text-xs font-medium border border-line rounded-md disabled:opacity-30 hover:bg-card transition-colors"
                            >Previous</button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={logs.length < 20}
                                className="px-3 py-1.5 text-xs font-medium border border-line rounded-md disabled:opacity-30 hover:bg-card transition-colors"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
