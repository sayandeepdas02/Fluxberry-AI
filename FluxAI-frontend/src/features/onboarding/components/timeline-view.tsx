import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { candidateOnboardingApi, ActivityLogEntry } from '@/lib/api/candidate-onboarding'
import { Loader2, User, FileText, Upload, CheckCircle, Mail, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

interface TimelineViewProps {
    onboardingId: string
}

export function TimelineView({ onboardingId }: TimelineViewProps) {
    const [logs, setLogs] = useState<ActivityLogEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        const fetchTimeline = async () => {
            setIsLoading(true)
            try {
                const res = await candidateOnboardingApi.getTimeline(onboardingId, page, 20)
                if (res.success && res.data) {
                    setLogs(res.data.timeline)
                    setTotalPages(res.data.pagination.pages)
                }
            } catch (error) {
                console.error('Failed to load timeline', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchTimeline()
    }, [onboardingId, page])

    const getIcon = (eventType: string) => {
        switch (eventType) {
            case 'ONBOARDING_INITIALIZED': return <User className="w-4 h-4 text-blue-500" />
            case 'FORM_SUBMITTED': return <FileText className="w-4 h-4 text-indigo-500" />
            case 'FORM_REJECTED': return <AlertTriangle className="w-4 h-4 text-orange-500" />
            case 'DOCUMENT_UPLOADED': return <Upload className="w-4 h-4 text-purple-500" />
            case 'DOCUMENT_APPROVED': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'DOCUMENT_REJECTED': return <AlertTriangle className="w-4 h-4 text-orange-500" />
            case 'REMINDER_SENT': return <Mail className="w-4 h-4 text-yellow-500" />
            case 'ONBOARDING_COMPLETED': return <CheckCircle className="w-4 h-4 text-green-600" />
            default: return <User className="w-4 h-4 text-gray-400" />
        }
    }

    const formatEventName = (eventType: string) => {
        return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    }

    if (isLoading && logs.length === 0) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    }

    if (logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    No activity recorded yet for this onboarding process.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Audit log of all actions taken by the candidate and system</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative border-l border-muted ml-3 space-y-6">
                    {logs.map((log, idx) => (
                        <div key={log._id || idx} className="relative pl-6">
                            <span className="absolute -left-2.5 top-1 bg-background border rounded-full p-1 shadow-sm">
                                {getIcon(log.eventType)}
                            </span>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{formatEventName(log.eventType)}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'PPpp')}</span>
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <pre className="mt-2 p-2 bg-muted/50 rounded text-[10px] overflow-x-auto text-muted-foreground">
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                            Newer
                        </button>
                        <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                            Older
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
