"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { prospectsApi, Campaign } from "@/lib/api/prospects"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    Loader2, Send, Plus, Rocket, Mail, MailOpen, MessageSquare,
    RefreshCw, AlertTriangle, BarChart3, Gauge,
} from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

const STATUS_MAP: Record<string, { label: string; class: string }> = {
    draft: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
    sending: { label: 'Sending', class: 'bg-amber-500/10 text-amber-400' },
    completed: { label: 'Completed', class: 'bg-emerald-500/10 text-emerald-400' },
    paused: { label: 'Paused', class: 'bg-red-500/10 text-red-400' },
}

const DAILY_EMAIL_CAP = 200 // Configurable limit

export default function CampaignsPage() {
    const queryClient = useQueryClient()
    const [showCreate, setShowCreate] = useState(false)
    const [isFollowUp, setIsFollowUp] = useState(false)
    const [followUpParentId, setFollowUpParentId] = useState('')
    const [name, setName] = useState('')
    const [listId, setListId] = useState('')
    const [templateId, setTemplateId] = useState('')

    const { data: campaignsRes, isLoading } = useQuery({
        queryKey: ['campaigns'],
        queryFn: () => prospectsApi.listCampaigns(),
    })
    const campaigns = campaignsRes?.data || []

    const { data: listsRes } = useQuery({
        queryKey: ['prospect-lists'],
        queryFn: () => prospectsApi.listLists(),
        enabled: showCreate,
    })

    const { data: templatesRes } = useQuery({
        queryKey: ['email-templates'],
        queryFn: async () => {
            const { apiClient } = await import('@/lib/api/client')
            return apiClient.get('/email-templates')
        },
        enabled: showCreate,
    })

    const lists = listsRes?.data || []
    const templates = (templatesRes?.data || []) as any[]

    // ── Aggregate metrics ──────────────────────────────────
    const totalSentToday = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        return campaigns
            .filter(c => c.status !== 'draft' && c.createdAt?.slice(0, 10) === today)
            .reduce((acc, c) => acc + (c.stats?.sent || 0), 0)
    }, [campaigns])

    const templateMetrics = useMemo(() => {
        const map = new Map<string, { name: string; sent: number; opened: number; replied: number }>()
        campaigns.forEach(c => {
            const tName = typeof c.templateId === 'object' ? c.templateId.name : 'Unknown'
            const tId = typeof c.templateId === 'object' ? c.templateId._id : c.templateId as string
            const existing = map.get(tId) || { name: tName, sent: 0, opened: 0, replied: 0 }
            existing.sent += c.stats?.sent || 0
            existing.opened += c.stats?.opened || 0
            existing.replied += c.stats?.replied || 0
            map.set(tId, existing)
        })
        return Array.from(map.values()).filter(m => m.sent > 0)
    }, [campaigns])

    // Completed campaigns that can have follow-ups
    const completedCampaigns = campaigns.filter(c => c.status === 'completed')

    const createMutation = useMutation({
        mutationFn: (data: { name: string; listId: string; templateId: string }) =>
            prospectsApi.createCampaign(data),
        onSuccess: () => {
            toast.success(isFollowUp ? 'Follow-up campaign created' : 'Campaign created')
            resetForm()
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        },
        onError: () => toast.error('Failed to create campaign'),
    })

    const sendMutation = useMutation({
        mutationFn: (id: string) => prospectsApi.sendCampaign(id),
        onSuccess: (res) => {
            toast.success(`Campaign sent! ${res.data?.sent}/${res.data?.total} emails delivered.`)
            queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        },
        onError: () => toast.error('Failed to send campaign'),
    })

    const resetForm = () => {
        setShowCreate(false)
        setIsFollowUp(false)
        setFollowUpParentId('')
        setName('')
        setListId('')
        setTemplateId('')
    }

    const startFollowUp = (campaign: Campaign) => {
        const parentListId = typeof campaign.listId === 'object' ? campaign.listId._id : campaign.listId
        setIsFollowUp(true)
        setFollowUpParentId(campaign._id)
        setName(`Follow-up: ${campaign.name}`)
        setListId(parentListId)
        setTemplateId('')
        setShowCreate(true)
    }

    const remaining = Math.max(0, DAILY_EMAIL_CAP - totalSentToday)

    return (
        <PageContainer title="Campaigns" description="Run targeted outreach campaigns to engage top talent at scale.">
            <div className="mt-6 w-full flex flex-col space-y-6">
                {/* ── Rate Limit Banner ───────────────────────────── */}
                <div className="flex items-center justify-between p-3 bg-card/50 border border-line rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Gauge className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Daily sends:</span>
                            <span className={`font-semibold ${remaining < 20 ? 'text-red-400' : remaining < 50 ? 'text-amber-400' : 'text-foreground'}`}>
                                {totalSentToday}/{DAILY_EMAIL_CAP}
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    remaining < 20 ? 'bg-red-500' : remaining < 50 ? 'bg-amber-500' : 'bg-accent'
                                }`}
                                style={{ width: `${Math.min(100, (totalSentToday / DAILY_EMAIL_CAP) * 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">{remaining} remaining</span>
                    </div>

                    <button
                        onClick={() => { setIsFollowUp(false); setShowCreate(!showCreate) }}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </div>

                {/* ── Low Limit Warning ───────────────────────────── */}
                {remaining < 20 && remaining > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400 animate-in slide-in-from-top-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>You&apos;re approaching your daily email limit. {remaining} sends remaining.</span>
                    </div>
                )}

                {/* ── Per-Template Performance ────────────────────── */}
                {templateMetrics.length > 0 && (
                    <div className="border border-line rounded-lg bg-card/50 p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" /> Template Performance
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {templateMetrics.map((tm, i) => {
                                const openRate = tm.sent > 0 ? Math.round((tm.opened / tm.sent) * 100) : 0
                                const replyRate = tm.sent > 0 ? Math.round((tm.replied / tm.sent) * 100) : 0
                                return (
                                    <div key={i} className="p-3 bg-muted/20 rounded-lg border border-line/50">
                                        <p className="text-sm font-medium truncate">{tm.name}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{tm.sent} sent</span>
                                            <span className={openRate >= 40 ? 'text-emerald-400' : openRate >= 20 ? 'text-amber-400' : 'text-red-400'}>
                                                {openRate}% open
                                            </span>
                                            <span className={replyRate >= 10 ? 'text-emerald-400' : replyRate >= 5 ? 'text-amber-400' : 'text-red-400'}>
                                                {replyRate}% reply
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── Create Form ─────────────────────────────────── */}
                {showCreate && (
                    <div className="p-6 border border-line rounded-lg bg-card/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">
                                {isFollowUp ? '🔄 Create Follow-Up Campaign' : 'New Campaign'}
                            </h3>
                            {isFollowUp && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <RefreshCw className="w-3 h-3" /> Follow-up
                                </Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} className="bg-card" />
                            <Select value={listId} onValueChange={setListId}>
                                <SelectTrigger className="bg-card border-line"><SelectValue placeholder="Select List" /></SelectTrigger>
                                <SelectContent>
                                    {lists.map((l: any) => (<SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className="bg-card border-line"><SelectValue placeholder="Select Template" /></SelectTrigger>
                                <SelectContent>
                                    {templates.map((t: any) => (<SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        {isFollowUp && (
                            <p className="text-xs text-muted-foreground">
                                💡 This follow-up will target the same list as the parent campaign. Use a different template to re-engage unresponsive prospects.
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (!name || !listId || !templateId) return toast.error('All fields required')
                                    createMutation.mutate({ name, listId, templateId })
                                }}
                                disabled={createMutation.isPending}
                                className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                            >{isFollowUp ? 'Create Follow-Up' : 'Create'}</button>
                            <button onClick={resetForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                    </div>
                )}

                {/* ── Campaign Cards ──────────────────────────────── */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : campaigns.length === 0 ? (
                    <EmptyState icon={Send} title="No campaigns yet" description="Create your first outreach campaign to start engaging talent at scale."
                        actions={[{ label: 'Create Campaign', onClick: () => { setIsFollowUp(false); setShowCreate(true) }, variant: 'primary' }]} />
                ) : (
                    <div className="grid gap-4">
                        {campaigns.map((c: Campaign) => {
                            const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.draft
                            const listName = typeof c.listId === 'object' ? c.listId.name : 'Unknown'
                            const templateName = typeof c.templateId === 'object' ? c.templateId.name : 'Unknown'
                            const openRate = c.stats.sent > 0 ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0
                            const replyRate = c.stats.sent > 0 ? Math.round((c.stats.replied / c.stats.sent) * 100) : 0

                            return (
                                <div key={c._id} className="p-5 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{c.name}</h3>
                                                <Badge className={`text-xs ${statusInfo.class}`}>{statusInfo.label}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                List: {listName} · Template: {templateName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {c.status === 'completed' && (
                                                <button
                                                    onClick={() => startFollowUp(c)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" /> Follow Up
                                                </button>
                                            )}
                                            {c.status === 'draft' && (
                                                <button
                                                    onClick={() => sendMutation.mutate(c._id)}
                                                    disabled={sendMutation.isPending || remaining === 0}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                                    title={remaining === 0 ? 'Daily email limit reached' : undefined}
                                                >
                                                    <Rocket className="w-3.5 h-3.5" /> Send Now
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats with rates */}
                                    {c.status !== 'draft' && (
                                        <div className="flex items-center gap-6 mt-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-4 h-4" /><span>{c.stats.sent} sent</span></div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <MailOpen className="w-4 h-4" />
                                                <span>{c.stats.opened} opened</span>
                                                <span className={`text-xs font-medium ${openRate >= 40 ? 'text-emerald-400' : openRate >= 20 ? 'text-amber-400' : 'text-red-400'}`}>({openRate}%)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <MessageSquare className="w-4 h-4" />
                                                <span>{c.stats.replied} replied</span>
                                                <span className={`text-xs font-medium ${replyRate >= 10 ? 'text-emerald-400' : replyRate >= 5 ? 'text-amber-400' : 'text-red-400'}`}>({replyRate}%)</span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-muted-foreground/50 mt-3">
                                        Created {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
