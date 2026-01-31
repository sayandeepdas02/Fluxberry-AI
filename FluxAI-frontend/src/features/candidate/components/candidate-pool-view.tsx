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
import { candidates } from "../mocks/candidates"

export function CandidatePoolView() {
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
                        {candidates.length}
                    </Badge>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search candidates..."
                        disabled
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors cursor-not-allowed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="border border-edge rounded-lg overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-edge">
                            <TableHead className="w-[200px] text-muted-foreground font-medium">Candidate Name</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Applied For</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Experience</TableHead>
                            <TableHead className="text-right text-muted-foreground font-medium">Resume</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.map((candidate) => (
                            <TableRow key={candidate.id} className="hover:bg-muted/50 border-b border-edge last:border-0 transition-colors">
                                <TableCell className="font-medium text-foreground">{candidate.name}</TableCell>
                                <TableCell className="text-muted-foreground">{candidate.contact}</TableCell>
                                <TableCell>
                                    <Badge variant="neutral" className="font-normal">
                                        {candidate.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                                <TableCell className="text-muted-foreground">{candidate.experience}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end">
                                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors group" title="View Resume">
                                            <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
