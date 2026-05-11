"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { interviewsApi, IInterview, IScorecard } from "@/lib/api/interviews"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import {
    Video, Loader2, Calendar, Clock, User, Star,
    CheckCircle, ExternalLink,
} from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
    SCHEDULED:    { label: 'Scheduled',    class: 'bg-sky-500/10 text-sky-400' },
    COMPLETED:    { label: 'Completed',    class: 'bg-emerald-500/10 text-emerald-400' },
    CANCELLED:    { label: 'Cancelled',    class: 'bg-red-500/10 text-red-400' },
    RESCHEDULED:  { label: 'Rescheduled',  class: 'bg-amber-500/10 text-amber-400' },
    NO_SHOW:      { label: 'No Show',      class: 'bg-zinc-500/10 text-zinc-400' },
}

const RECOMMENDATION_STYLES: Record<string, { label: string; class: string }> = {
    STRONG_HIRE:    { label: '💚 Strong Hire',    class: 'text-emerald-400' },
    HIRE:           { label: '✅ Hire',            class: 'text-green-400' },
    NO_HIRE:        { label: '🚫 No Hire',         class: 'text-red-400' },
    STRONG_NO_HIRE: { label: '❌ Strong No Hire',  class: 'text-red-500' },
}

export default function LiveInterviewsPage() {
    const [statusFilter, setStatusFilter] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [showScorecard, setShowScorecard] = useState(false)

    // Scorecard form state
    const [scOverall, setScOverall] = useState(3)
    const [scRecommendation, setScRecommendation] = useState<string>('HIRE')
    const [scSections, setScSections] = useState([
        { name: 'Technical Skills', rating: 3, feedback: '' },
        { name: 'Problem Solving', rating: 3, feedback: '' },
        { name: 'Communication', rating: 3, feedback: '' },
        { name: 'Culture Fit', rating: 3, feedback: '' },
    ])
    const [scNotes, setScNotes] = useState('')

    const { data: response, isLoading } = useQuery({
        queryKey: ['interviews', statusFilter],
        queryFn: () => interviewsApi.list(statusFilter ? { status: statusFilter } : undefined),
    })
    const interviews = (response?.data || []) as IInterview[]

    const { data: scorecardRes } = useQuery({
        queryKey: ['scorecard', selectedId],
        queryFn: () => interviewsApi.getScorecard(selectedId!),
        enabled: !!selectedId,
    })
    const scorecard = scorecardRes?.data

    const selected = interviews.find(i => i._id === selectedId)

    const submitScorecardMutation = useApiMutation({
        mutationFn: () => {
            if (!selectedId) throw new Error('No interview')
            return interviewsApi.submitScorecard(selectedId, {
                overallRating: scOverall,
                recommendation: scRecommendation as any,
                sections: scSections,
                privateNotes: scNotes,
            })
        },
        successMessage: 'Scorecard submitted',
        errorMessage: 'Failed to submit scorecard',
        invalidateKeys: [['interviews'], ['scorecard', selectedId]],
        onSuccess: () => { setShowScorecard(false) },
    })

    const cancelMutation = useApiMutation({
        mutationFn: (id: string) => interviewsApi.cancel(id),
        successMessage: 'Interview cancelled',
        invalidateKeys: [['interviews']],
    })

    function getCandidateName(interview: IInterview) {
        if (typeof interview.candidateId === 'object' && interview.candidateId !== null) {
            const c = interview.candidateId as any
            return c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : c.email || 'Unknown'
        }
        return 'Unknown'
    }

    return (
        <PageContainer title="Live Interviews" description="Schedule, manage, and score live interviews with real-time feedback.">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
                        <SelectTrigger className="w-[160px] bg-card border-line"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground flex-1">{interviews.length} interview{interviews.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Interview list */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : interviews.length === 0 ? (
                    <EmptyState icon={Video} title="No interviews scheduled"
                        description="Schedule interviews from the candidate pipeline. Scorecards will be available after each session." />
                ) : (
                    <div className="grid gap-3">
                        {interviews.map((interview: IInterview) => {
                            const statusInfo = STATUS_STYLES[interview.status] || STATUS_STYLES.SCHEDULED
                            const candidateName = getCandidateName(interview)

                            return (
                                <div key={interview._id}
                                    className="p-4 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                                    onClick={() => setSelectedId(interview._id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{interview.title}</h3>
                                                <Badge className={`text-xs ${statusInfo.class}`}>{statusInfo.label}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{candidateName}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(interview.startTime), 'MMM dd, yyyy')}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(interview.startTime), 'HH:mm')}</span>
                                                {interview.feedbackSubmitted && (
                                                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" />Scored</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {interview.meetingLink && (
                                                <a href={interview.meetingLink} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20">
                                                    <ExternalLink className="w-3 h-3" /> Join
                                                </a>
                                            )}
                                            {interview.status === 'SCHEDULED' && (
                                                <button onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(interview._id) }}
                                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors">Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Interview Detail Drawer ──────────────────────── */}
            <Sheet open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setShowScorecard(false) } }}>
                <SheetContent className="w-full sm:max-w-lg bg-background border-l border-line p-0 flex flex-col">
                    {selected ? (
                        <>
                            <div className="p-6 border-b border-line">
                                <SheetHeader>
                                    <SheetTitle className="text-xl font-semibold mt-4">{selected.title}</SheetTitle>
                                </SheetHeader>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className={`text-xs ${STATUS_STYLES[selected.status]?.class || ''}`}>{STATUS_STYLES[selected.status]?.label || selected.status}</Badge>
                                    {selected.feedbackSubmitted && <Badge className="bg-emerald-500/10 text-emerald-400 text-xs">Scored</Badge>}
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(selected.startTime), 'PPP')}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(selected.startTime), 'p')} – {format(new Date(selected.endTime), 'p')}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Existing scorecard */}
                                {scorecard && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400" /> Scorecard</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-bold">{scorecard.overallRating}/5</span>
                                            <span className={RECOMMENDATION_STYLES[scorecard.recommendation]?.class || ''}>
                                                {RECOMMENDATION_STYLES[scorecard.recommendation]?.label || scorecard.recommendation}
                                            </span>
                                        </div>
                                        {scorecard.sections?.map((s, i) => (
                                            <div key={i} className="p-3 bg-muted/20 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{s.name}</span>
                                                    <span className="text-sm font-bold">{s.rating}/5</span>
                                                </div>
                                                {s.feedback && <p className="text-xs text-muted-foreground mt-1">{s.feedback}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Submit scorecard form */}
                                {!scorecard && selected.status !== 'CANCELLED' && (
                                    <>
                                        {!showScorecard ? (
                                            <button onClick={() => setShowScorecard(true)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground font-medium rounded-lg hover:opacity-90">
                                                <Star className="w-4 h-4" /> Submit Scorecard
                                            </button>
                                        ) : (
                                            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                                                <h4 className="text-sm font-semibold">Scorecard</h4>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-muted-foreground">Overall Rating</label>
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <button key={n} onClick={() => setScOverall(n)}
                                                                className={`w-8 h-8 rounded-full text-sm font-bold ${n <= scOverall ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                {n}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Select value={scRecommendation} onValueChange={setScRecommendation}>
                                                    <SelectTrigger className="bg-card border-line"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="STRONG_HIRE">Strong Hire</SelectItem>
                                                        <SelectItem value="HIRE">Hire</SelectItem>
                                                        <SelectItem value="NO_HIRE">No Hire</SelectItem>
                                                        <SelectItem value="STRONG_NO_HIRE">Strong No Hire</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {scSections.map((s, i) => (
                                                    <div key={i} className="space-y-1.5 p-3 bg-muted/10 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium">{s.name}</span>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <button key={n} onClick={() => { const ns = [...scSections]; ns[i].rating = n; setScSections(ns) }}
                                                                        className={`w-6 h-6 rounded-full text-[10px] font-bold ${n <= s.rating ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                        {n}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <Input placeholder={`Feedback for ${s.name}...`} value={s.feedback}
                                                            onChange={(e) => { const ns = [...scSections]; ns[i].feedback = e.target.value; setScSections(ns) }} className="bg-card text-sm" />
                                                    </div>
                                                ))}

                                                <textarea placeholder="Private notes..." value={scNotes} onChange={(e) => setScNotes(e.target.value)} rows={2}
                                                    className="w-full px-3 py-2 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent" />

                                                <div className="flex gap-2">
                                                    <button onClick={() => submitScorecardMutation.mutate()} disabled={submitScorecardMutation.isPending}
                                                        className="flex-1 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50">Submit</button>
                                                    <button onClick={() => setShowScorecard(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">Interview not found.</div>
                    )}
                </SheetContent>
            </Sheet>
        </PageContainer>
    )
}
