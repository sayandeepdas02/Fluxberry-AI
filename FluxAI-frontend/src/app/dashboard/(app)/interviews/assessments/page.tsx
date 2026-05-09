"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { assessmentsApi, CreateAssessmentInput } from "@/lib/api/assessments"
import { Assessment } from "@/lib/api/types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    ClipboardList, Plus, Loader2, Play, Copy, Clock, Users, Send,
    CheckCircle, Pencil, MoreHorizontal,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
    ACTIVE: { label: 'Active', class: 'bg-emerald-500/10 text-emerald-400' },
    PAUSED: { label: 'Paused', class: 'bg-amber-500/10 text-amber-400' },
    ARCHIVED: { label: 'Archived', class: 'bg-red-500/10 text-red-400' },
    CLOSED: { label: 'Closed', class: 'bg-red-500/10 text-red-400' },
}

const ROUND_LABELS: Record<string, string> = { MCQ: 'MCQ', DSA: 'DSA', AI: 'AI Interview' }

export default function AssessmentsPage() {
    const [showCreate, setShowCreate] = useState(false)
    const [title, setTitle] = useState('')
    const [showInvite, setShowInvite] = useState<string | null>(null)
    const [inviteEmails, setInviteEmails] = useState('')

    const { data: response, isLoading } = useQuery({
        queryKey: ['assessments'],
        queryFn: () => assessmentsApi.list(),
    })
    const assessments = response?.data || []

    const createMutation = useApiMutation({
        mutationFn: (input: CreateAssessmentInput) => assessmentsApi.create(input),
        successMessage: 'Assessment created',
        invalidateKeys: [['assessments']],
        onSuccess: () => {
            setShowCreate(false)
            setTitle('')
        },
    })

    const publishMutation = useApiMutation({
        mutationFn: (id: string) => assessmentsApi.publish(id),
        successMessage: 'Assessment published',
        invalidateKeys: [['assessments']],
    })

    const cloneMutation = useApiMutation({
        mutationFn: (id: string) => assessmentsApi.clone(id),
        successMessage: 'Assessment cloned',
        invalidateKeys: [['assessments']],
    })

    const inviteMutation = useApiMutation({
        mutationFn: ({ id, emails }: { id: string; emails: string[] }) => assessmentsApi.invite(id, { emails }),
        invalidateKeys: [['assessments']],
        onSuccess: (res) => {
            toast.success(`${res?.invited || 0} candidates invited`)
            setShowInvite(null)
            setInviteEmails('')
        },
    })

    return (
        <PageContainer title="Assessments" description="Create and manage technical assessments for candidate evaluation.">
            <ErrorBoundary section="Assessments">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* Actions */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''}</p>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> New Assessment
                    </button>
                </div>

                {/* Create Form */}
                {showCreate && (
                    <div className="p-6 border border-line rounded-lg bg-card/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <h3 className="font-semibold text-sm">Create Assessment</h3>
                        <Input placeholder="Assessment title (e.g. 'Backend Engineer - Senior')" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-card max-w-md" autoFocus />
                        <div className="flex gap-2">
                            <button onClick={() => { if (!title.trim()) return toast.error('Title required'); createMutation.mutate({ title }) }}
                                disabled={createMutation.isPending}
                                className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50">Create</button>
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Assessment Cards */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : assessments.length === 0 && !showCreate ? (
                    <EmptyState icon={ClipboardList} title="No assessments yet" description="Create assessments with MCQ, DSA, and AI interview rounds to evaluate candidates."
                        actions={[{ label: 'Create Assessment', onClick: () => setShowCreate(true), variant: 'primary' }]} />
                ) : (
                    <div className="grid gap-4">
                        {assessments.map((a: Assessment) => {
                            const statusInfo = STATUS_STYLES[a.status] || STATUS_STYLES.DRAFT
                            const enabledRounds = a.rounds?.filter(r => r.enabled) || []

                            return (
                                <div key={a.id} className="p-5 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{a.title}</h3>
                                                <Badge className={`text-xs ${statusInfo.class}`}>{statusInfo.label}</Badge>
                                            </div>

                                            {/* Rounds */}
                                            <div className="flex items-center gap-3 mt-2">
                                                {enabledRounds.map(r => (
                                                    <span key={r.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-[11px] font-medium text-muted-foreground">
                                                        {ROUND_LABELS[r.roundType] || r.roundType}
                                                    </span>
                                                ))}
                                                {enabledRounds.length === 0 && <span className="text-xs text-muted-foreground/50">No rounds configured</span>}
                                            </div>

                                            {/* Metrics row */}
                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                {a.timeLimit > 0 && (
                                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.timeLimit} min</span>
                                                )}
                                                {a.candidateCount !== undefined && (
                                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{a.candidateCount} invited</span>
                                                )}
                                                {a.completedCount !== undefined && a.completedCount > 0 && (
                                                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{a.completedCount} completed</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {a.status === 'DRAFT' && (
                                                <button onClick={() => publishMutation.mutate(a.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-colors">
                                                    <Play className="w-3.5 h-3.5" /> Publish
                                                </button>
                                            )}
                                            {a.status === 'ACTIVE' && (
                                                <button onClick={() => setShowInvite(showInvite === a.id ? null : a.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors">
                                                    <Send className="w-3.5 h-3.5" /> Invite
                                                </button>
                                            )}
                                            <button onClick={() => cloneMutation.mutate(a.id)}
                                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Clone">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Invite panel */}
                                    {showInvite === a.id && (
                                        <div className="mt-4 p-4 border border-accent/20 rounded-lg bg-accent/5 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                            <p className="text-sm font-medium">Invite Candidates</p>
                                            <textarea
                                                placeholder="Enter emails separated by commas or new lines..."
                                                value={inviteEmails}
                                                onChange={(e) => setInviteEmails(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    const emails = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e.includes('@'))
                                                    if (emails.length === 0) return toast.error('Enter at least one valid email')
                                                    inviteMutation.mutate({ id: a.id, emails })
                                                }}
                                                    disabled={inviteMutation.isPending}
                                                    className="px-4 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-50">
                                                    Send Invites
                                                </button>
                                                <button onClick={() => { setShowInvite(null); setInviteEmails('') }}
                                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-muted-foreground/50 mt-3">Created {format(new Date(a.createdAt), 'MMM dd, yyyy')}</p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
            </ErrorBoundary>
        </PageContainer>
    )
}
