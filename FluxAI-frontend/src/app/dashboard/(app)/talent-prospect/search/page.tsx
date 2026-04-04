"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { prospectsApi, Prospect } from "@/lib/api/prospects"
import { jobsApi } from "@/lib/api/jobs"
import { useProspectStore } from "@/lib/store/prospect-store"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    Search, Loader2, ListPlus, ArrowRight, Sparkles, Building2, MapPin, Briefcase,
    TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Zap,
} from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

function useDebounce<T>(value: T, delay: number): T {
    const [v, setV] = useState(value)
    useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
    return v
}

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-sky-500/10 text-sky-400',
    contacted: 'bg-amber-500/10 text-amber-400',
    replied: 'bg-emerald-500/10 text-emerald-400',
    converted: 'bg-violet-500/10 text-violet-400',
}

// ── Mock AI Analysis ──────────────────────────────────────
function generateProspectAI(p: Prospect) {
    const score = Math.min(95, 40 + (p.experience || 0) * 5 + (p.skills?.length || 0) * 8)
    return {
        fitScore: score,
        fitLabel: score >= 75 ? 'Strong' : score >= 50 ? 'Moderate' : 'Low',
        strengths: [
            p.experience && p.experience >= 5 ? 'Senior-level experience' : 'Early career with growth potential',
            p.skills?.length ? `${p.skills.length} relevant skills identified` : null,
            p.company ? `Industry experience at ${p.company}` : null,
        ].filter(Boolean) as string[],
        risks: [
            !p.skills?.length ? 'No skills data available' : null,
            p.status === 'new' ? 'Not yet contacted — cold outreach needed' : null,
        ].filter(Boolean) as string[],
        suggestion: score >= 75
            ? 'Strong match — prioritize outreach and conversion.'
            : 'Consider nurturing before conversion.',
    }
}

export default function TalentSearchPage() {
    const queryClient = useQueryClient()
    const {
        selectedProspectId, setSelectedProspect, isDrawerOpen, setDrawerOpen,
        selectedIds, toggleSelect, selectAll, clearSelection,
    } = useProspectStore()

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const debouncedSearch = useDebounce(search, 500)

    // ── Conversion state ───────────────────────────────
    const [showConvertFlow, setShowConvertFlow] = useState(false)
    const [convertJobId, setConvertJobId] = useState('')
    const [convertSuccess, setConvertSuccess] = useState<null | { name: string; jobTitle: string }>(null)

    const { data: response, isLoading } = useQuery({
        queryKey: ['prospects', page, debouncedSearch, status],
        queryFn: () => prospectsApi.list({
            page, limit: 20,
            search: debouncedSearch || undefined,
            status: status || undefined,
        }),
    })

    const prospects = response?.data || []
    const meta = response?.meta || { total: 0, totalPages: 1 }
    const allIds = prospects.map(p => p._id)
    const allSelected = prospects.length > 0 && allIds.every(id => selectedIds.has(id))

    // Prospect detail
    const { data: detailResponse, isLoading: detailLoading } = useQuery({
        queryKey: ['prospect', selectedProspectId],
        queryFn: () => prospectsApi.getById(selectedProspectId!),
        enabled: !!selectedProspectId,
    })
    const prospectDetail = detailResponse?.data
    const aiInsight = prospectDetail ? generateProspectAI(prospectDetail) : null

    // Jobs for convert selector
    const { data: jobsRes } = useQuery({
        queryKey: ['jobs', 'active'],
        queryFn: () => jobsApi.list({ status: 'PUBLISHED' }),
        enabled: showConvertFlow,
    })
    const jobs = jobsRes?.data || []

    // Convert mutation
    const convertMutation = useMutation({
        mutationFn: (id: string) => prospectsApi.convertToCandidate(id),
        onSuccess: (res) => {
            const candidateName = prospectDetail ? `${prospectDetail.firstName} ${prospectDetail.lastName}` : 'Prospect'
            const jobTitle = jobs.find(j => j._id === convertJobId)?.title || 'ATS'
            setConvertSuccess({ name: candidateName, jobTitle })
            setShowConvertFlow(false)
            queryClient.invalidateQueries({ queryKey: ['prospects'] })
            queryClient.invalidateQueries({ queryKey: ['prospect', selectedProspectId] })
        },
        onError: () => toast.error('Conversion failed'),
    })

    const handleAddToList = () => {
        if (selectedIds.size === 0) return toast.info('Select prospects first')
        toast.info(`Adding ${selectedIds.size} prospects to list... (modal coming soon)`)
    }

    const startConversion = () => {
        setConvertSuccess(null)
        setShowConvertFlow(true)
        setConvertJobId('')
    }

    return (
        <PageContainer title="Talent Search" description="Discover and source candidates from your prospect database.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                {/* ── Filters Bar ──────────────────────────────────── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[260px] max-w-md">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                        <Input
                            placeholder="Search by name, email, company..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="pl-9 bg-card"
                        />
                    </div>
                    <Select value={status} onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1) }}>
                        <SelectTrigger className="w-[160px] bg-card border-line">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex-1" />

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                            <span className="text-sm text-accent font-medium">{selectedIds.size} selected</span>
                            <button
                                onClick={handleAddToList}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors"
                            >
                                <ListPlus className="w-3.5 h-3.5" />
                                Add to List
                            </button>
                            <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Results Table ────────────────────────────────── */}
                <div className="border border-line rounded-lg bg-card/50 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-10">
                                    <Checkbox checked={allSelected} onCheckedChange={(c) => c ? selectAll(allIds) : clearSelection()} />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="h-64 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                            ) : prospects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 p-0">
                                        <EmptyState icon={Sparkles} title="Start sourcing talent" description="Search for candidates or add prospects manually to build your outbound pipeline."
                                            actions={[
                                                { label: 'Add Prospect', onClick: () => toast.info('Add prospect form coming soon'), variant: 'primary' },
                                                { label: 'Import CSV', onClick: () => toast.info('CSV import coming soon'), variant: 'secondary' },
                                            ]}
                                            className="border-none rounded-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                prospects.map((p) => (
                                    <TableRow
                                        key={p._id}
                                        className={`cursor-pointer transition-colors ${selectedIds.has(p._id) ? 'bg-accent/10' : 'hover:bg-muted/40'}`}
                                        onClick={() => { setSelectedProspect(p._id); setConvertSuccess(null); setShowConvertFlow(false) }}
                                    >
                                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox checked={selectedIds.has(p._id)} onCheckedChange={() => toggleSelect(p._id)} />
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-text-primary">{p.firstName} {p.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{p.email}</p>
                                        </TableCell>
                                        <TableCell className="text-sm text-text-secondary">{p.company || '—'}</TableCell>
                                        <TableCell className="text-sm text-text-secondary">{p.role || '—'}</TableCell>
                                        <TableCell className="text-sm text-text-secondary">{p.location || '—'}</TableCell>
                                        <TableCell><Badge className={`capitalize text-xs ${STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {p.status !== 'converted' && (
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedProspect(p._id); startConversion() }}
                                                    className="text-xs font-medium text-accent hover:underline">Add to ATS</button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* ── Pagination ──────────────────────────────────── */}
                {meta.totalPages && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p>Page {page} of {meta.totalPages} · {meta.total} prospects</p>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-card border border-line rounded-md hover:bg-muted disabled:opacity-50 transition-colors">Previous</button>
                            <button disabled={page >= (meta.totalPages || 1)} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-card border border-line rounded-md hover:bg-muted disabled:opacity-50 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Profile Preview Drawer ─────────────────────────── */}
            <Sheet open={isDrawerOpen} onOpenChange={(open) => { setDrawerOpen(open); if (!open) { setShowConvertFlow(false); setConvertSuccess(null) } }}>
                <SheetContent className="w-full sm:max-w-lg bg-background border-l border-line p-0 flex flex-col">
                    {detailLoading ? (
                        <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                    ) : prospectDetail ? (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-line">
                                <SheetHeader>
                                    <SheetTitle className="text-xl font-semibold mt-4">{prospectDetail.firstName} {prospectDetail.lastName}</SheetTitle>
                                </SheetHeader>
                                <p className="text-sm text-muted-foreground mt-1">{prospectDetail.email}</p>
                                <Badge className={`capitalize mt-2 ${STATUS_COLORS[prospectDetail.status]}`}>{prospectDetail.status}</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* ── AI Intelligence Section ──────────── */}
                                {aiInsight && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-accent" /> AI Analysis
                                        </h4>

                                        <div className="flex items-center justify-between p-3 bg-card/60 border border-line rounded-lg">
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">Fit Score</p>
                                                <p className="text-xl font-bold">{aiInsight.fitScore}%</p>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                                aiInsight.fitScore >= 75 ? 'bg-emerald-500/10 text-emerald-400'
                                                : aiInsight.fitScore >= 50 ? 'bg-amber-500/10 text-amber-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>{aiInsight.fitLabel} Fit</div>
                                        </div>

                                        {aiInsight.strengths.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-emerald-400 flex items-center gap-1 mb-1.5"><TrendingUp className="w-3.5 h-3.5" /> Strengths</p>
                                                {aiInsight.strengths.map((s, i) => (
                                                    <p key={i} className="text-xs text-text-secondary flex items-start gap-1.5 mt-1">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{s}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {aiInsight.risks.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-amber-400 flex items-center gap-1 mb-1.5"><TrendingDown className="w-3.5 h-3.5" /> Risks</p>
                                                {aiInsight.risks.map((r, i) => (
                                                    <p key={i} className="text-xs text-text-secondary flex items-start gap-1.5 mt-1">
                                                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />{r}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        <div className="p-3 bg-accent/5 border border-accent/10 rounded-lg">
                                            <p className="text-xs text-text-secondary leading-relaxed"><Zap className="w-3 h-3 inline mr-1 text-accent" />{aiInsight.suggestion}</p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/40 text-center italic">AI-generated · May not reflect complete data</p>
                                    </div>
                                )}

                                {/* ── Profile Fields ──────────────────── */}
                                <div className="space-y-3 border-t border-line pt-4">
                                    {prospectDetail.company && (
                                        <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-muted-foreground" /><span>{prospectDetail.company}</span></div>
                                    )}
                                    {prospectDetail.role && (
                                        <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-muted-foreground" /><span>{prospectDetail.role}</span></div>
                                    )}
                                    {prospectDetail.location && (
                                        <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{prospectDetail.location}</span></div>
                                    )}
                                    {prospectDetail.experience !== undefined && (
                                        <div className="text-sm text-text-secondary">{prospectDetail.experience} years experience</div>
                                    )}
                                    {prospectDetail.skills && prospectDetail.skills.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Skills</p>
                                            <div className="flex flex-wrap gap-1.5">{prospectDetail.skills.map((s, i) => (<Badge key={i} variant="outline" className="text-xs">{s}</Badge>))}</div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Convert to Candidate Flow ──────── */}
                                <div className="pt-4 border-t border-line space-y-3">
                                    {/* Success state */}
                                    {convertSuccess && (
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-emerald-400">Converted to Candidate!</p>
                                                <p className="text-xs text-text-secondary mt-1">
                                                    {convertSuccess.name} has been added to your ATS{convertSuccess.jobTitle !== 'ATS' ? ` under "${convertSuccess.jobTitle}"` : ''}.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Conversion form */}
                                    {prospectDetail.status !== 'converted' && !convertSuccess && (
                                        <>
                                            {!showConvertFlow ? (
                                                <button
                                                    onClick={startConversion}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
                                                >
                                                    <ArrowRight className="w-4 h-4" /> Convert to Candidate
                                                </button>
                                            ) : (
                                                <div className="p-4 border border-accent/20 rounded-lg bg-accent/5 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                                                    <p className="text-sm font-medium">Select a job to create an application:</p>
                                                    <Select value={convertJobId} onValueChange={setConvertJobId}>
                                                        <SelectTrigger className="bg-card border-line">
                                                            <SelectValue placeholder="Choose job (optional)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No job — just add to ATS</SelectItem>
                                                            {jobs.map((j: any) => (
                                                                <SelectItem key={j._id} value={j._id}>{j.title}{j.department ? ` (${j.department})` : ''}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => convertMutation.mutate(prospectDetail._id)}
                                                            disabled={convertMutation.isPending}
                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
                                                        >
                                                            {convertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                            Confirm Conversion
                                                        </button>
                                                        <button onClick={() => setShowConvertFlow(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <button
                                        onClick={handleAddToList}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-line text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <ListPlus className="w-4 h-4" /> Add to List
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">Prospect not found.</div>
                    )}
                </SheetContent>
            </Sheet>
        </PageContainer>
    )
}
