"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { talentCRMApi, TalentPool } from "@/lib/api/talent-crm"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import {
    Users, ArrowLeft, Loader2, Trash2, UserCheck, Mail,
} from "lucide-react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useCandidatesStore } from "@/lib/store/candidates-store"
import { CandidateDrawer } from "@/components/dashboard/candidates/candidate-drawer"

export default function PoolDetailPage({ params }: { params: Promise<{ poolId: string }> }) {
    const { poolId } = use(params)
    const router = useRouter()
    const { setSelectedCandidate } = useCandidatesStore()

    const { data: poolRes } = useQuery({
        queryKey: ['talent-pool', poolId],
        queryFn: () => talentCRMApi.getPool(poolId),
    })
    const pool = poolRes?.data as TalentPool | undefined

    const { data: candidatesRes, isLoading } = useQuery({
        queryKey: ['talent-pool-candidates', poolId],
        queryFn: () => talentCRMApi.getPoolCandidates(poolId),
    })
    const candidates = (candidatesRes?.data as any)?.data || []

    const removeMutation = useApiMutation({
        mutationFn: (candidateId: string) => talentCRMApi.removeCandidates(poolId, [candidateId]),
        successMessage: 'Removed from pool',
        invalidateKeys: [['talent-pool-candidates', poolId], ['talent-pool', poolId]],
    })

    return (
        <PageContainer
            title={pool?.name || 'Talent Pool'}
            description={pool?.description || 'Manage candidates in this talent pool.'}
        >
            <div className="mt-6 w-full flex flex-col space-y-5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard/crm')}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to CRM
                    </button>
                    {pool && (
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pool.color || '#3b82f6' }} />
                            {pool.isSmartList && <Badge className="text-[10px] bg-violet-500/10 text-violet-400">Smart List</Badge>}
                            <span className="text-sm text-muted-foreground">{candidates.length} candidates</span>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : candidates.length === 0 ? (
                    <EmptyState icon={Users} title="No candidates in this pool"
                        description="Add candidates from their profile drawer using the 'Add to Pool' action." />
                ) : (
                    <div className="grid gap-3">
                        {candidates.map((c: any) => {
                            const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
                            return (
                                <div
                                    key={c._id}
                                    className="flex items-center gap-4 p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold shrink-0">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                                    </div>
                                    {c.tags?.length > 0 && (
                                        <div className="hidden sm:flex gap-1">
                                            {c.tags.slice(0, 2).map((t: string) => (
                                                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                            ))}
                                        </div>
                                    )}
                                    {c.source && (
                                        <span className="text-xs text-muted-foreground/60 hidden md:block">{c.source}</span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setSelectedCandidate(c._id)}
                                            className="p-1.5 text-muted-foreground hover:text-accent transition-colors rounded"
                                            title="View profile"
                                        >
                                            <UserCheck className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => removeMutation.mutate(c._id)}
                                            className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded"
                                            title="Remove from pool"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <CandidateDrawer />
        </PageContainer>
    )
}
