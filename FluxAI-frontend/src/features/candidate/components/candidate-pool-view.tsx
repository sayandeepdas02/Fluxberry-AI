"use client"

import { Search, FileText, Filter, X } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PremiumEmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCandidates } from "@/features/candidate/hooks/use-candidates"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"

export function CandidatePoolView() {
    const [search, setSearch] = useState("")
    const [source, setSource] = useState<string>("all")
    const [tags, setTags] = useState("")

    const debouncedSearch = useDebounce(search, 500)
    const debouncedTags = useDebounce(tags, 500)

    const { candidates, total, isLoading, error, refetch } = useCandidates()

    useEffect(() => {
        refetch({
            search: debouncedSearch || undefined,
            source: source === "all" ? undefined : source,
            tags: debouncedTags || undefined
        })
    }, [debouncedSearch, source, debouncedTags, refetch])

    const clearFilters = () => {
        setSearch("")
        setSource("all")
        setTags("")
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading candidates...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">Error: {error}</div>
    }

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span>Candidate Pool</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Candidate Pool
                    </h1>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Website">Website</SelectItem>
                                <SelectItem value="Direct">Direct</SelectItem>
                                <SelectItem value="Agency">Agency</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="relative w-[200px]">
                            <Input
                                placeholder="Filter by tags (comma separated)..."
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                            />
                        </div>

                        {(search || source !== "all" || tags) && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span className="font-medium">{total}</span> candidates found
                </div>
            </div>

            <div className="border border-line rounded-none overflow-hidden bg-background shadow-none">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-line">
                            <TableHead className="w-[200px] text-muted-foreground font-medium">Candidate Name</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Phone</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Source</TableHead>
                            <TableHead className="text-right text-muted-foreground font-medium">Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="p-8">
                                    <PremiumEmptyState 
                                        title="No candidates yet"
                                        description="Build your talent pool instantly. Ask AI to source candidates matching your latest job descriptions."
                                        actionLabel="Generate with AI ⚡"
                                        onAction={() => {}}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.map((candidate) => (
                                <TableRow key={candidate._id} className="hover:bg-muted/30 border-b border-line group transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs shrink-0">
                                                {candidate.firstName ? candidate.firstName[0] : 'U'}
                                            </div>
                                            <p className="font-semibold text-foreground">
                                                {candidate.firstName && candidate.lastName
                                                    ? `${candidate.firstName} ${candidate.lastName}`
                                                    : 'Unknown Name'}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                                    <TableCell className="text-muted-foreground">{candidate.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-none bg-muted/50 font-medium text-muted-foreground border-line px-3 py-1 shadow-none">
                                            {candidate.source || 'Direct'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {format(new Date(candidate.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
