"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    Inbox, Bell, CheckCircle, Check, CheckCheck, Brain, UserPlus,
    Send, MailOpen, AlertTriangle, Loader2, Trash2,
} from "lucide-react"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"

// ── Types ────────────────────────────────────────────────
interface Notification {
    _id: string
    type: 'interview_completed' | 'campaign_reply' | 'candidate_moved' | 'application_received' | 'ai_screening_completed' | 'system'
    title: string
    message: string
    read: boolean
    entityId?: string
    entityType?: string
    createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
    interview_completed: { icon: Brain, color: 'text-accent' },
    campaign_reply: { icon: MailOpen, color: 'text-emerald-400' },
    candidate_moved: { icon: UserPlus, color: 'text-blue-400' },
    application_received: { icon: Send, color: 'text-purple-400' },
    ai_screening_completed: { icon: CheckCircle, color: 'text-emerald-400' },
    system: { icon: Bell, color: 'text-muted-foreground' },
}

// Mock notifications — replace with real API when backend is ready
function useMockNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([
        { _id: '1', type: 'ai_screening_completed', title: 'AI Screening Complete', message: 'John Doe scored 82/100 for Backend Engineer role. Recommendation: HIRE', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
        { _id: '2', type: 'campaign_reply', title: 'Campaign Reply', message: 'Sarah Chen replied to your outreach campaign "Senior Engineers Q2"', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { _id: '3', type: 'candidate_moved', title: 'Pipeline Update', message: 'Alex Johnson moved to Interview stage for Frontend Engineer', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        { _id: '4', type: 'application_received', title: 'New Application', message: 'Maria Garcia applied for Full Stack Developer position', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
        { _id: '5', type: 'interview_completed', title: 'Interview Done', message: 'Live interview with David Kim for DevOps Engineer has been completed. Scorecard pending.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString() },
        { _id: '6', type: 'system', title: 'Welcome to Flexberry AI', message: 'Your workspace is set up and ready. Start by creating your first job posting.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ])

    return {
        notifications,
        markRead: (id: string) => setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n)),
        markAllRead: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
        dismiss: (id: string) => setNotifications(prev => prev.filter(n => n._id !== id)),
    }
}

export default function InboxPage() {
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const { notifications, markRead, markAllRead, dismiss } = useMockNotifications()

    const unreadCount = notifications.filter(n => !n.read).length
    const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications

    return (
        <PageContainer title="Inbox" description="All your notifications, messages, and updates in one place.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                {/* Header controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                            All ({notifications.length})
                        </button>
                        <button onClick={() => setFilter('unread')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'unread' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                            Unread ({unreadCount})
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                    )}
                </div>

                {/* Notification list */}
                {filtered.length === 0 ? (
                    <EmptyState icon={Inbox} title={filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        description={filter === 'unread' ? 'You have no unread notifications.' : 'Notifications will appear here as events occur in your workspace.'} />
                ) : (
                    <div className="space-y-2">
                        {filtered.map(n => {
                            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
                            const Icon = config.icon
                            return (
                                <div key={n._id}
                                    onClick={() => !n.read && markRead(n._id)}
                                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer group ${
                                        n.read
                                            ? 'bg-card/30 border-line/50 hover:bg-card/50'
                                            : 'bg-card/50 border-accent/20 hover:bg-card/80'
                                    }`}>
                                    <div className={`mt-0.5 shrink-0 ${config.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                                            {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                                        </div>
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] text-muted-foreground/50 mt-1.5">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); dismiss(n._id) }}
                                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
