"use client"

import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/lib/hooks/use-api-mutation'
import { candidatesApi, Candidate } from '@/lib/api/candidates'
import { applicationsApi } from '@/lib/api/applications'
import { useCandidatesStore } from '@/lib/store/candidates-store'
import { Search, Loader2, Users, UserPlus, Upload, X, ArrowRightCircle, Ban } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CandidateFilters } from './filters'
import { EmptyState } from '../empty-state'
import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}

export function CandidatesTable() {
    const {
        setSelectedCandidate, page, search, setSearch, stage, setPage,
        selectedIds, toggleSelect, selectAll, clearSelection,
        focusedIndex, setFocusedIndex,
    } = useCandidatesStore()
    const debouncedSearch = useDebounce(search, 500)
    const tableRef = useRef<HTMLDivElement>(null)

    const { data: response, isLoading } = useQuery({
        queryKey: ['candidates', page, debouncedSearch, stage],
        queryFn: () => candidatesApi.list({
            page,
            search: debouncedSearch || undefined,
            stage: stage || undefined,
            limit: 15
        }),
        refetchInterval: 15000, // Polling: refetch every 15 seconds
    })

    const candidates = response?.data || []
    const meta = response?.meta || { total: 0, totalPages: 1 }

    const allIds = candidates.map(c => c._id)
    const allSelected = candidates.length > 0 && allIds.every(id => selectedIds.has(id))
    const someSelected = selectedIds.size > 0

    // ── Bulk Actions Mutations ──────────────────────────────────────
    const bulkRejectMutation = useApiMutation({
        mutationFn: (ids: string[]) =>
            applicationsApi.bulkUpdate({ applicationIds: ids, action: 'REJECT' }),
        successMessage: (res) => `${res.data?.updated || 0} applications rejected`,
        errorMessage: 'Bulk reject failed. Please try again.',
        invalidateKeys: [['candidates']],
        onSuccess: () => {
            clearSelection()
        },
    })

    // ── Keyboard Navigation ─────────────────────────────────────────
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!candidates.length) return

        // Ignore if user is typing in the search input
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setFocusedIndex(Math.min(focusedIndex + 1, candidates.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setFocusedIndex(Math.max(focusedIndex - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (focusedIndex >= 0 && focusedIndex < candidates.length) {
                    setSelectedCandidate(candidates[focusedIndex]._id)
                }
                break
            case ' ':
                e.preventDefault()
                if (focusedIndex >= 0 && focusedIndex < candidates.length) {
                    toggleSelect(candidates[focusedIndex]._id)
                }
                break
            case 'Escape':
                if (someSelected) {
                    e.preventDefault()
                    clearSelection()
                }
                break
        }
    }, [candidates, focusedIndex, setFocusedIndex, setSelectedCandidate, toggleSelect, someSelected, clearSelection])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Reset focused index when data changes
    useEffect(() => {
        setFocusedIndex(-1)
    }, [page, debouncedSearch, stage, setFocusedIndex])

    return (
        <div className="w-full flex flex-col space-y-4" ref={tableRef}>
            {/* ── Top Bar: Search + Filters + Bulk ────────────────────── */}
            <div className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-2 max-w-sm w-full relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 z-10" />
                    <Input
                        placeholder="Search candidates by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 w-full bg-card"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <CandidateFilters />
                </div>
            </div>

            {/* ── Bulk Actions Bar ───────────────────────────────────── */}
            {someSelected && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-accent/10 border border-accent/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
                    <span className="text-sm font-medium text-accent">
                        {selectedIds.size} selected
                    </span>
                    <div className="h-4 w-px bg-line" />
                    <button
                        onClick={() => {
                            // Note: Bulk reject requires application IDs, not candidate IDs.
                            // For now this surfaces the action; you'd map candidate → application IDs on the server.
                            bulkRejectMutation.mutate(Array.from(selectedIds))
                        }}
                        disabled={bulkRejectMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                        <Ban className="w-3.5 h-3.5" />
                        Reject
                    </button>
                    <button
                        onClick={() => toast.info('Bulk stage move coming soon')}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors"
                    >
                        <ArrowRightCircle className="w-3.5 h-3.5" />
                        Move Stage
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={clearSelection}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── Table ──────────────────────────────────────────────── */}
            <div className="border border-line rounded-lg bg-card/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            selectAll(allIds)
                                        } else {
                                            clearSelection()
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : candidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 p-0">
                                    <EmptyState
                                        icon={Users}
                                        title="No candidates yet"
                                        description="Start building your talent pipeline by adding candidates manually or importing from a CSV."
                                        actions={[
                                            {
                                                label: 'Add Candidate',
                                                onClick: () => toast.info('Add candidate form coming soon'),
                                                variant: 'primary',
                                            },
                                            {
                                                label: 'Import CSV',
                                                onClick: () => toast.info('CSV import coming soon'),
                                                variant: 'secondary',
                                            },
                                        ]}
                                        className="border-none rounded-none"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.map((candidate, idx) => (
                                <TableRow
                                    key={candidate._id}
                                    data-focused={focusedIndex === idx}
                                    className={`cursor-pointer transition-colors
                                        ${focusedIndex === idx ? 'bg-accent/5 ring-1 ring-inset ring-accent/20' : 'hover:bg-muted/40'}
                                        ${selectedIds.has(candidate._id) ? 'bg-accent/10' : ''}
                                    `}
                                    onClick={() => setSelectedCandidate(candidate._id)}
                                >
                                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.has(candidate._id)}
                                            onCheckedChange={() => toggleSelect(candidate._id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium text-text-primary">
                                            {candidate.firstName} {candidate.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                                    </TableCell>
                                    <TableCell>
                                        {candidate.source ? (
                                            <Badge variant="outline" className="text-xs capitalize mix-blend-plus-lighter">
                                                {candidate.source}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-text-secondary">
                                        {format(new Date(candidate.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button className="text-sm font-medium text-accent hover:underline">
                                            View Profile
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Pagination ─────────────────────────────────────────── */}
            {meta.totalPages && meta.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                    <p>
                        Showing page {page} of {meta.totalPages}
                        {meta.total ? ` · ${meta.total} candidates` : ''}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="px-3 py-1 bg-card border border-line rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= (meta.totalPages || 1)}
                            onClick={() => setPage(page + 1)}
                            className="px-3 py-1 bg-card border border-line rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ── Keyboard Hints ─────────────────────────────────────── */}
            {candidates.length > 0 && (
                <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/60 select-none">
                    <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> Navigate</span>
                    <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> Open</span>
                    <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Space</kbd> Select</span>
                    <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Clear</span>
                </div>
            )}
        </div>
    )
}
