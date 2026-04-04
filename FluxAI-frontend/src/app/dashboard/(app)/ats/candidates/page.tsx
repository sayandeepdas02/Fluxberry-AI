"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { candidatesApi, Candidate } from "@/lib/api/candidates"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { UserCheck, Search, Loader2 } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

export default function ATSCandidatesPage() {
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const { data: response, isLoading } = useQuery({
        queryKey: ['ats-candidates', page, search],
        queryFn: () => candidatesApi.list({ page, limit: 25, search: search || undefined }),
    })

    const candidates = response?.data || []
    const total = (response as any)?.meta?.total || candidates.length

    return (
        <PageContainer title="All Candidates" description="View all candidates across every job and pipeline stage.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                        <Input
                            placeholder="Search candidates..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="pl-9 bg-card"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">{total} candidate{total !== 1 ? 's' : ''}</p>
                </div>

                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                    </div>
                )}

                {!isLoading && candidates.length === 0 && (
                    <EmptyState
                        icon={UserCheck}
                        title="No candidates in ATS"
                        description="Candidates will appear here once they apply or are sourced into your pipeline."
                    />
                )}

                {!isLoading && candidates.length > 0 && (
                    <>
                        <div className="border border-line rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Added</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {candidates.map((c: Candidate) => (
                                        <TableRow key={c._id} className="hover:bg-card/50 transition-colors">
                                            <TableCell className="font-medium text-sm">
                                                {c.firstName ? `${c.firstName} ${c.lastName}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-text-secondary">{c.email}</TableCell>
                                            <TableCell>
                                                <Badge className="text-[10px] bg-muted text-muted-foreground">{c.source || 'direct'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(c.createdAt), 'MMM d, yyyy')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Page {page}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
                                    className="px-3 py-1.5 text-xs border border-line rounded-md disabled:opacity-30 hover:bg-card transition-colors">Previous</button>
                                <button onClick={() => setPage(p => p+1)} disabled={candidates.length < 25}
                                    className="px-3 py-1.5 text-xs border border-line rounded-md disabled:opacity-30 hover:bg-card transition-colors">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </PageContainer>
    )
}
