"use client"

import { Search, FileText } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useCandidates } from "@/features/candidate/hooks/use-candidates"
import { format } from "date-fns"

export function CandidatePoolView() {
    const { candidates, total, isLoading, error } = useCandidates()

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

            <div className="flex items-center justify-between bg-card border border-edge rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">All Candidates</span>
                    <Badge variant="neutral" className="rounded-full px-2 py-0.5 text-xs">
                        {total}
                    </Badge>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="border border-edge rounded-lg overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-edge">
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
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No candidates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.map((candidate) => (
                                <TableRow key={candidate._id} className="hover:bg-muted/50 border-b border-edge last:border-0 transition-colors">
                                    <TableCell className="font-medium text-foreground">
                                        {candidate.firstName && candidate.lastName
                                            ? `${candidate.firstName} ${candidate.lastName}`
                                            : 'Unknown Name'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                                    <TableCell className="text-muted-foreground">{candidate.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal text-muted-foreground">
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
