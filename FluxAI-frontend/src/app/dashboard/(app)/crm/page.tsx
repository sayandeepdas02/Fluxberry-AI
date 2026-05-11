"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { talentCRMApi, TalentPool, FollowUpReminder, CandidateBookmark } from "@/lib/api/talent-crm"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Users, BookmarkCheck, Bell, Search, Plus, Trash2, CheckCircle2,
    Clock, AlertCircle, Layers, ChevronRight, Loader2,
} from "lucide-react"
import { useState } from "react"
import { format, isAfter, isBefore } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const FIT_COLORS: Record<string, string> = {
    strong:    'bg-emerald-500/10 text-emerald-400',
    good:      'bg-blue-500/10 text-blue-400',
    potential: 'bg-amber-500/10 text-amber-400',
    weak:      'bg-red-500/10 text-red-400',
}

function PoolCard({ pool, onClick }: { pool: TalentPool; onClick: () => void }) {
    return (
        <div
            className="p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pool.color || '#3b82f6' }} />
                    <div>
                        <h3 className="font-semibold text-sm">{pool.name}</h3>
                        {pool.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pool.description}</p>}
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{pool.candidateCount} candidates</span>
                {pool.isSmartList && <Badge className="text-[10px] bg-violet-500/10 text-violet-400">Smart List</Badge>}
                <span className="ml-auto">{format(new Date(pool.createdAt), 'MMM d')}</span>
            </div>
        </div>
    )
}

function ReminderRow({ reminder, onComplete, onDelete }: {
    reminder: FollowUpReminder
    onComplete: (id: string) => void
    onDelete: (id: string) => void
}) {
    const candidate = typeof reminder.candidateId === 'object' ? reminder.candidateId : null
    const name = candidate ? [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || candidate.email : 'Unknown'
    const isOverdue = isBefore(new Date(reminder.dueAt), new Date())

    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-line/50 last:border-0">
            <div className={cn('w-2 h-2 rounded-full shrink-0', isOverdue ? 'bg-red-400' : 'bg-amber-400')} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{reminder.note}</p>
            </div>
            <span className={cn('text-[10px] font-medium shrink-0', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                {isOverdue ? 'Overdue · ' : ''}{format(new Date(reminder.dueAt), 'MMM d')}
            </span>
            <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onComplete(reminder._id)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors" title="Mark done">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(reminder._id)} className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

export default function TalentCRMPage() {
    const router = useRouter()
    const [tab, setTab] = useState<'pools' | 'bookmarks' | 'reminders'>('pools')
    const [showCreatePool, setShowCreatePool] = useState(false)
    const [poolName, setPoolName] = useState('')
    const [poolDesc, setPoolDesc] = useState('')
    const [poolColor, setPoolColor] = useState('#3b82f6')
    const [reminderFilter, setReminderFilter] = useState<'upcoming' | 'overdue' | 'done'>('upcoming')

    const { data: poolsRes, isLoading: poolsLoading } = useQuery({
        queryKey: ['talent-pools'],
        queryFn: () => talentCRMApi.listPools(),
    })
    const pools = (poolsRes?.data as any)?.data || (poolsRes?.data as any) || []

    const { data: remindersRes, isLoading: remindersLoading } = useQuery({
        queryKey: ['reminders', reminderFilter],
        queryFn: () => talentCRMApi.listReminders(reminderFilter),
        enabled: tab === 'reminders',
    })
    const reminders = (remindersRes?.data || []) as FollowUpReminder[]

    const { data: bookmarksRes, isLoading: bookmarksLoading } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: () => talentCRMApi.listBookmarks(),
        enabled: tab === 'bookmarks',
    })
    const bookmarks = (bookmarksRes?.data || []) as CandidateBookmark[]

    const createPoolMutation = useApiMutation({
        mutationFn: () => talentCRMApi.createPool({ name: poolName, description: poolDesc, color: poolColor }),
        successMessage: 'Talent pool created',
        invalidateKeys: [['talent-pools']],
        onSuccess: () => { setShowCreatePool(false); setPoolName(''); setPoolDesc('') },
    })

    const completeReminderMutation = useApiMutation({
        mutationFn: (id: string) => talentCRMApi.completeReminder(id),
        successMessage: 'Reminder completed',
        invalidateKeys: [['reminders', reminderFilter]],
    })

    const deleteReminderMutation = useApiMutation({
        mutationFn: (id: string) => talentCRMApi.deleteReminder(id),
        successMessage: 'Reminder deleted',
        invalidateKeys: [['reminders', reminderFilter]],
    })

    const removeBookmarkMutation = useApiMutation({
        mutationFn: (candidateId: string) => talentCRMApi.removeBookmark(candidateId),
        successMessage: 'Bookmark removed',
        invalidateKeys: [['bookmarks']],
    })

    const TABS = [
        { key: 'pools',     label: 'Talent Pools',   icon: Layers,        count: pools.length },
        { key: 'bookmarks', label: 'Bookmarks',       icon: BookmarkCheck, count: bookmarks.length },
        { key: 'reminders', label: 'Reminders',       icon: Bell,          count: reminders.filter((r: any) => !r.done).length },
    ] as const

    const overdueCount = reminders.filter(r => !r.done && isBefore(new Date(r.dueAt), new Date())).length

    return (
        <PageContainer title="Talent CRM" description="Manage talent pools, saved searches, bookmarks, and follow-up reminders.">
            <div className="mt-6 w-full flex flex-col space-y-6">

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-line">
                    {TABS.map(({ key, label, icon: Icon, count }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                                tab === key
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {key === 'reminders' && overdueCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 rounded-full">{overdueCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Talent Pools ──────────────────────────────────── */}
                {tab === 'pools' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{pools.length} pool{pools.length !== 1 ? 's' : ''}</p>
                            <button
                                onClick={() => setShowCreatePool(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90"
                            >
                                <Plus className="w-3.5 h-3.5" /> New Pool
                            </button>
                        </div>

                        {poolsLoading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : pools.length === 0 ? (
                            <EmptyState icon={Layers} title="No talent pools yet"
                                description="Create pools to organize candidates by skill, stage, or sourcing campaign."
                                actionLabel="Create Pool" onAction={() => setShowCreatePool(true)} />
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {pools.map((pool: TalentPool) => (
                                    <PoolCard key={pool._id} pool={pool} onClick={() => router.push(`/dashboard/crm/pools/${pool._id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Bookmarks ─────────────────────────────────────── */}
                {tab === 'bookmarks' && (
                    <div className="space-y-3">
                        {bookmarksLoading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : bookmarks.length === 0 ? (
                            <EmptyState icon={BookmarkCheck} title="No bookmarks yet"
                                description="Bookmark candidates from their profile drawer to track them here." />
                        ) : (
                            <div className="grid gap-3">
                                {bookmarks.map((bm: CandidateBookmark) => {
                                    const c = typeof bm.candidateId === 'object' ? bm.candidateId : null
                                    const name = c ? [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email : 'Unknown'
                                    const cId = typeof bm.candidateId === 'object' ? bm.candidateId._id : bm.candidateId
                                    return (
                                        <div key={bm._id} className="flex items-center gap-3 p-3 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{name}</p>
                                                {bm.note && <p className="text-xs text-muted-foreground mt-0.5">{bm.note}</p>}
                                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Bookmarked {format(new Date(bm.createdAt), 'MMM d, yyyy')}</p>
                                            </div>
                                            <button
                                                onClick={() => removeBookmarkMutation.mutate(cId)}
                                                className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Reminders ─────────────────────────────────────── */}
                {tab === 'reminders' && (
                    <div className="space-y-4">
                        {/* Filter tabs */}
                        <div className="flex gap-2">
                            {(['upcoming', 'overdue', 'done'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setReminderFilter(f)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                                        reminderFilter === f
                                            ? 'border-accent text-accent bg-accent/10'
                                            : 'border-line text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                    {f === 'overdue' && overdueCount > 0 && ` (${overdueCount})`}
                                </button>
                            ))}
                        </div>

                        {remindersLoading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : reminders.length === 0 ? (
                            <EmptyState icon={Bell} title={`No ${reminderFilter} reminders`}
                                description="Add follow-up reminders from candidate profiles to track outreach." />
                        ) : (
                            <div className="border border-line rounded-lg bg-card/30 divide-y divide-line/50 px-4">
                                {reminders.map((r: FollowUpReminder) => (
                                    <ReminderRow
                                        key={r._id}
                                        reminder={r}
                                        onComplete={(id) => completeReminderMutation.mutate(id)}
                                        onDelete={(id) => deleteReminderMutation.mutate(id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Pool Dialog */}
            <Dialog open={showCreatePool} onOpenChange={setShowCreatePool}>
                <DialogContent className="sm:max-w-md bg-background border-line">
                    <DialogHeader>
                        <DialogTitle>Create Talent Pool</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Pool Name *</label>
                            <Input value={poolName} onChange={e => setPoolName(e.target.value)} placeholder="e.g. Senior Engineers Q2, React Developers..." className="bg-card" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                            <Input value={poolDesc} onChange={e => setPoolDesc(e.target.value)} placeholder="What's this pool for?" className="bg-card" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setPoolColor(c)}
                                        className={cn('w-7 h-7 rounded-full transition-transform', poolColor === c ? 'scale-125 ring-2 ring-white/30 ring-offset-1 ring-offset-background' : 'hover:scale-110')}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setShowCreatePool(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                            <button
                                onClick={() => createPoolMutation.mutate()}
                                disabled={!poolName.trim() || createPoolMutation.isPending}
                                className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {createPoolMutation.isPending ? 'Creating…' : 'Create Pool'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageContainer>
    )
}
