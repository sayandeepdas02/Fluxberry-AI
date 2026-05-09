"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { prospectsApi, ProspectList, Prospect } from "@/lib/api/prospects"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Loader2, List, Plus, Users, Trash2, ArrowUpDown, Tag } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-sky-500/10 text-sky-400',
    contacted: 'bg-amber-500/10 text-amber-400',
    replied: 'bg-emerald-500/10 text-emerald-400',
    converted: 'bg-violet-500/10 text-violet-400',
}

const STATUS_ORDER: Record<string, number> = { replied: 0, contacted: 1, new: 2, converted: 3 }

type SortKey = 'recent' | 'replied' | 'contacted' | 'name'

export default function TalentListsPage() {
    const [selectedListId, setSelectedListId] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newListName, setNewListName] = useState('')
    const [newListDesc, setNewListDesc] = useState('')
    const [sortBy, setSortBy] = useState<SortKey>('recent')
    const [tagFilter, setTagFilter] = useState('')

    const { data: listsResponse, isLoading: listsLoading } = useQuery({
        queryKey: ['prospect-lists'],
        queryFn: () => prospectsApi.listLists(),
    })
    const lists = listsResponse?.data || []

    const { data: listDetailResponse, isLoading: detailLoading } = useQuery({
        queryKey: ['prospect-list', selectedListId],
        queryFn: () => prospectsApi.getListById(selectedListId!),
        enabled: !!selectedListId,
    })
    const listDetail = listDetailResponse?.data

    const createMutation = useApiMutation({
        mutationFn: (data: { name: string; description?: string }) => prospectsApi.createList(data),
        successMessage: 'List created',
        invalidateKeys: [['prospect-lists']],
        onSuccess: () => {
            setShowCreateForm(false)
            setNewListName('')
            setNewListDesc('')
        },
    })

    const removeMutation = useApiMutation({
        mutationFn: ({ listId, prospectIds }: { listId: string; prospectIds: string[] }) =>
            prospectsApi.removeFromList(listId, prospectIds),
        successMessage: 'Removed from list',
        invalidateKeys: [['prospect-list', selectedListId], ['prospect-lists']],
    })

    const rawProspects = (listDetail?.prospectIds || []) as Prospect[]

    // ── Sorting ──────────────────────────────────────────────
    const sortedProspects = useMemo(() => {
        let sorted = [...rawProspects]
        switch (sortBy) {
            case 'recent':
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
            case 'replied':
                sorted.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
                break
            case 'contacted':
                sorted.sort((a, b) => {
                    const ac = a.status === 'contacted' ? 0 : 1
                    const bc = b.status === 'contacted' ? 0 : 1
                    return ac - bc
                })
                break
            case 'name':
                sorted.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                break
        }
        return sorted
    }, [rawProspects, sortBy])

    // ── Tags (derived from skills/role) ──────────────────────
    const allTags = useMemo(() => {
        const tags = new Set<string>()
        rawProspects.forEach(p => {
            p.skills?.forEach(s => tags.add(s))
            if (p.role) tags.add(p.role)
        })
        return Array.from(tags).slice(0, 20)
    }, [rawProspects])

    const filteredProspects = tagFilter
        ? sortedProspects.filter(p => p.skills?.includes(tagFilter) || p.role === tagFilter)
        : sortedProspects

    // Status breakdown
    const statusBreakdown = useMemo(() => {
        const counts = { new: 0, contacted: 0, replied: 0, converted: 0 }
        rawProspects.forEach(p => { if (p.status in counts) counts[p.status as keyof typeof counts]++ })
        return counts
    }, [rawProspects])

    return (
        <PageContainer title="Prospect Lists" description="Organize prospects into curated lists for targeted outreach.">
            <div className="mt-6 flex gap-6 h-[calc(100vh-220px)]">
                {/* ── Left: List Sidebar ──────────────────────────── */}
                <div className="w-72 shrink-0 border border-line rounded-lg bg-card/50 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-line flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Your Lists</h3>
                        <button onClick={() => setShowCreateForm(true)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {showCreateForm && (
                        <div className="p-3 border-b border-line space-y-2 bg-muted/20">
                            <Input placeholder="List name" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="text-sm bg-card" autoFocus />
                            <Input placeholder="Description (optional)" value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} className="text-sm bg-card" />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { if (!newListName.trim()) return toast.error('Name required'); createMutation.mutate({ name: newListName, description: newListDesc || undefined }) }}
                                    disabled={createMutation.isPending}
                                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                                >Create</button>
                                <button onClick={() => setShowCreateForm(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {listsLoading ? (
                            <div className="flex h-32 items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                        ) : lists.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">No lists yet. Create one to get started.</div>
                        ) : (
                            lists.map((list: ProspectList) => (
                                <button key={list._id} onClick={() => { setSelectedListId(list._id); setTagFilter('') }}
                                    className={`w-full text-left p-3 border-b border-line/50 transition-colors ${selectedListId === list._id ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-muted/40'}`}
                                >
                                    <p className="font-medium text-sm truncate">{list.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{Array.isArray(list.prospectIds) ? list.prospectIds.length : 0} prospects</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right: List Content ─────────────────────────── */}
                <div className="flex-1 border border-line rounded-lg bg-card/50 flex flex-col overflow-hidden">
                    {!selectedListId ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState icon={List} title="Select a list" description="Choose a list from the sidebar or create a new one to manage your prospects."
                                actions={[{ label: 'Create List', onClick: () => setShowCreateForm(true), variant: 'primary' }]} className="border-none" />
                        </div>
                    ) : detailLoading ? (
                        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <>
                            {/* Header + controls */}
                            <div className="p-4 border-b border-line space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{listDetail?.name}</h3>
                                        {listDetail?.description && <p className="text-xs text-muted-foreground mt-0.5">{listDetail.description}</p>}
                                    </div>
                                    <Badge variant="secondary">{rawProspects.length} prospects</Badge>
                                </div>

                                {/* Status breakdown chips */}
                                {rawProspects.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {Object.entries(statusBreakdown).filter(([, v]) => v > 0).map(([key, count]) => (
                                            <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_COLORS[key]}`}>
                                                {key}: {count}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Sort + Tag filter row */}
                                {rawProspects.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                                            <SelectTrigger className="w-[150px] h-8 text-xs bg-card border-line">
                                                <ArrowUpDown className="w-3 h-3 mr-1" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recent">Most Recent</SelectItem>
                                                <SelectItem value="replied">Replied First</SelectItem>
                                                <SelectItem value="contacted">Contacted First</SelectItem>
                                                <SelectItem value="name">Name A-Z</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {allTags.length > 0 && (
                                            <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
                                                <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <button
                                                    onClick={() => setTagFilter('')}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors ${!tagFilter ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                                >All</button>
                                                {allTags.slice(0, 8).map(tag => (
                                                    <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-colors ${tagFilter === tag ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                                    >{tag}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Prospect list */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredProspects.length === 0 ? (
                                    <div className="flex h-full items-center justify-center">
                                        <EmptyState icon={Users} title="No prospects in this list" description="Go to Search to find and add prospects to this list." className="border-none" />
                                    </div>
                                ) : (
                                    <div className="divide-y divide-line/50">
                                        {filteredProspects.map((p: Prospect) => (
                                            <div key={p._id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs text-muted-foreground">{p.email}</p>
                                                        {p.company && <span className="text-[10px] text-muted-foreground/60">· {p.company}</span>}
                                                    </div>
                                                    {/* Tag chips */}
                                                    {p.skills && p.skills.length > 0 && (
                                                        <div className="flex gap-1 mt-1.5">
                                                            {p.skills.slice(0, 3).map(s => (
                                                                <span key={s} className="text-[9px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">{s}</span>
                                                            ))}
                                                            {p.skills.length > 3 && <span className="text-[9px] text-muted-foreground/50">+{p.skills.length - 3}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={`capitalize text-[10px] ${STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge>
                                                    <button
                                                        onClick={() => removeMutation.mutate({ listId: selectedListId!, prospectIds: [p._id] })}
                                                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="Remove from list"
                                                    ><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageContainer>
    )
}
