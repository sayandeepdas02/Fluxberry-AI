"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CandidateDrawer } from "./candidate-drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Download, Users, Percent, Trophy, Search, UserCircle2, ArrowRight } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"

export function CandidatesTable() {
    const [candidates, setCandidates] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [jobs, setJobs] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [selectedJobId, setSelectedJobId] = useState<string>("ALL")
    const [analytics, setAnalytics] = useState<any>(null)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        fetch("/api/jobs")
            .then(res => res.json())
            .then(data => setJobs(data))
            .catch(err => console.error("Failed to fetch jobs", err));
    }, [])

    useEffect(() => {
        if (selectedJobId && selectedJobId !== "ALL") {
            fetch(`/api/jobs/${selectedJobId}/analytics`)
                .then(res => res.json())
                .then(data => setAnalytics(data))
                .catch(err => console.error(err));
        } else {
            setAnalytics(null);
        }
    }, [selectedJobId])

    useEffect(() => {
        const url = selectedJobId !== "ALL"
            ? `/api/dashboard/candidates?jobId=${selectedJobId}`
            : "/api/dashboard/candidates";

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setCandidates(data)
                setFiltered(data)
            })
    }, [selectedJobId])

    useEffect(() => {
        let result = candidates;

        if (search) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.email.toLowerCase().includes(search.toLowerCase()) ||
                c.job.title.toLowerCase().includes(search.toLowerCase())
            )
        }

        if (statusFilter !== "ALL") {
            result = result.filter(c => c.status === statusFilter)
        }

        setFiltered(result)
    }, [search, statusFilter, candidates])

    const updateCandidateStatus = async (candidateId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/applications/${candidateId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: updated.status } : c));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    }

    const exportCsv = async () => {
        if (selectedJobId === "ALL") return;
        setIsExporting(true);
        try {
            const res = await fetch(`/api/jobs/${selectedJobId}/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `candidates_export_${selectedJobId}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setIsExporting(false);
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "SHORTLISTED": return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
            case "REJECTED": return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
            case "INTERVIEWED": return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
            default: return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"; // APPLIED
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-[16px] shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                        <SelectTrigger className="w-full md:w-[280px] h-10 rounded-full bg-slate-50 border-slate-200">
                            <SelectValue placeholder="All Jobs" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[12px]">
                            <SelectItem value="ALL">All Jobs</SelectItem>
                            {jobs.map(j => (
                                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    {selectedJobId !== "ALL" && (
                        <Button
                            variant="outline"
                            onClick={exportCsv}
                            disabled={isExporting}
                            className="w-full md:w-auto h-10 rounded-full border-slate-200 font-medium"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? "Exporting..." : "Export CSV"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Analytics Grid */}
            {analytics && selectedJobId !== "ALL" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 hidden md:grid">
                    <StatCard
                        title="Total Applicants"
                        value={analytics.totalApplicants}
                    />
                    <StatCard
                        title="Average Score"
                        value={`${analytics.averageScore}%`}
                    />
                    <StatCard
                        title="Highest Score"
                        value={`${analytics.highestScore}%`}
                    />
                    <StatCard
                        title="Pass Rate"
                        value={`${analytics.passRatePercentage}%`}
                    />
                </div>
            )}

            {/* Table Area */}
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search candidates..."
                            className="w-full pl-9 h-10 rounded-full border-slate-200 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px] h-10 rounded-full border-slate-200 bg-white">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[12px]">
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="APPLIED">Applied</SelectItem>
                            <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                            <SelectItem value="INTERVIEWED">Interviewed</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="font-semibold text-slate-600 h-11">Candidate</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-11">Applied Job</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-11">Status</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-11">Test Score</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-11">Anti-Cheat</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-11">Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((c) => (
                            <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <UserCircle2 className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[14px] text-slate-900 leading-tight">{c.name}</span>
                                            <span className="text-[12px] text-slate-500">{c.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[14px] font-medium text-slate-700">{c.job.title}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Select
                                        defaultValue={c.status || "APPLIED"}
                                        onValueChange={(val) => updateCandidateStatus(c.id, val)}
                                    >
                                        <SelectTrigger className="w-[130px] h-8 text-[12px] font-bold tracking-wider uppercase border-0 p-0 focus:ring-0 shadow-none bg-transparent">
                                            <Badge variant="outline" className={cn("px-2.5 py-1 text-[11px] w-full justify-between cursor-pointer", getStatusStyles(c.status || "APPLIED"))}>
                                                {c.status || "APPLIED"}
                                            </Badge>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[10px]">
                                            <SelectItem value="APPLIED">APPLIED</SelectItem>
                                            <SelectItem value="SHORTLISTED">SHORTLISTED</SelectItem>
                                            <SelectItem value="INTERVIEWED">INTERVIEWED</SelectItem>
                                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    {c.job.testEnabled ? (
                                        c.testScore !== undefined && c.testScore !== null ? (
                                            <Badge variant="outline" className={cn(
                                                "border-0 px-2.5 py-1 text-[12px] font-bold",
                                                c.testPassed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                            )}>
                                                {c.testPassed ? "PASSED" : "FAILED"} <span className="opacity-75 ml-1">({c.testScore.toFixed(0)}%)</span>
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
                                                Pending
                                            </Badge>
                                        )
                                    ) : (
                                        <span className="text-[13px] text-slate-400 font-medium">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {c.flagged ? (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 w-fit px-2.5 py-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span className="font-bold">Flagged</span> <span className="text-[11px] font-medium opacity-75">({c.tabSwitchCount || 0} switches)</span>
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-slate-50 text-slate-400 border-transparent px-2.5 py-1 font-medium">Clear</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-[13px] text-slate-500 font-medium">
                                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-slate-900">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-[250px] text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Users className="h-10 w-10 text-slate-200 mb-3" />
                                        <p className="text-[15px] font-medium text-slate-600">No candidates found</p>
                                        <p className="text-[13px] text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <CandidateDrawer
                candidate={selectedCandidate}
                open={!!selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
            />
        </div>
    )
}
