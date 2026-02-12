'use client'

import { useEffect, useState, useCallback } from "react"
import { atsOnboardingApi, IOnboarding } from "@/lib/api/ats-onboarding"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { CheckCircle2, Search, FileText, Download, User } from "lucide-react"
import { toast } from "sonner"

export function CompletedOnboardingList() {
    const [onboardings, setOnboardings] = useState<IOnboarding[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchCompleted = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch all active onboardings and filter completed
            // When backend adds /onboarding/completed, switch to that
            const response = await atsOnboardingApi.getActiveOnboardings()
            if (response.success && response.data) {
                // Filter only completed ones (status === 'COMPLETED')
                const completed = response.data.filter(o => o.status === 'COMPLETED')
                setOnboardings(completed)
            }
        } catch (err: any) {
            // Silently handle — may not have data yet
            console.error('Failed to fetch completed onboardings:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCompleted()
    }, [fetchCompleted])

    const filtered = onboardings.filter(o =>
        o.candidateId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.applicationId?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getDocumentStats = (o: IOnboarding) => {
        const total = o.documents?.length || 0
        const approved = o.documents?.filter(d => d.status === 'APPROVED').length || 0
        return { total, approved }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />
                ))}
            </div>
        )
    }

    if (onboardings.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-muted/10 border-dashed">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No completed onboardings yet</h3>
                <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                    Once new hires complete their onboarding process, they&apos;ll appear here for your records.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by candidate or application ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/10">
                    <p className="text-sm text-muted-foreground">Total Completed</p>
                    <p className="text-2xl font-semibold mt-1">{onboardings.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Documents Processed</p>
                    <p className="text-2xl font-semibold mt-1">
                        {onboardings.reduce((sum, o) => sum + (o.documents?.length || 0), 0)}
                    </p>
                </div>
                <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                    <p className="text-2xl font-semibold mt-1">
                        {onboardings.length > 0
                            ? (() => {
                                const withDates = onboardings.filter(o => o.completedAt && o.startDate)
                                if (withDates.length === 0) return '—'
                                const avg = withDates.reduce((sum, o) => {
                                    const start = new Date(o.startDate).getTime()
                                    const end = new Date(o.completedAt!).getTime()
                                    return sum + (end - start)
                                }, 0) / withDates.length
                                const days = Math.round(avg / (1000 * 60 * 60 * 24))
                                return `${days}d`
                            })()
                            : '—'
                        }
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((onboarding) => {
                            const { total, approved } = getDocumentStats(onboarding)
                            return (
                                <TableRow key={onboarding._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <User className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {onboarding.candidateId?.slice(-6) || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    App: {onboarding.applicationId?.slice(-6)}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {onboarding.startDate
                                            ? format(new Date(onboarding.startDate), 'MMM d, yyyy')
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {onboarding.completedAt
                                            ? format(new Date(onboarding.completedAt), 'MMM d, yyyy')
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{approved}/{total} approved</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Completed
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
