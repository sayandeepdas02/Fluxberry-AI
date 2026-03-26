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
import { AlertCircle, Download, Users, Percent, Trophy, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"

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

    // Load jobs on mount
    useEffect(() => {
        fetch("/api/jobs")
            .then(res => res.json())
            .then(data => setJobs(data))
            .catch(err => console.error("Failed to fetch jobs", err));
    }, [])

    // Fetch Analytics when a specific job is selected
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

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "SHORTLISTED": return "success";
            case "REJECTED": return "destructive";
            case "INTERVIEWED": return "info";
            default: return "secondary"; // APPLIED
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="All Jobs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Jobs</SelectItem>
                            {jobs.map(j => (
                                <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedJobId !== "ALL" && (
                        <Button
                            variant="outline"
                            onClick={exportCsv}
                            disabled={isExporting}
                            className="w-full md:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? "Exporting..." : "Export CSV"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Analytics Grid */}
            {analytics && selectedJobId !== "ALL" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 hidden md:grid">
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <Input
                    placeholder="Search candidates..."
                    className="max-w-sm rounded-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] rounded-lg">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="APPLIED">Applied</SelectItem>
                        <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                        <SelectItem value="INTERVIEWED">Interviewed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Applied Job</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Test Score</TableHead>
                            <TableHead>Anti-Cheat</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">{c.name}</span>
                                        <span className="text-[13px] text-slate-500">{c.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium">{c.job.title}</TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={c.status || "APPLIED"}
                                        onValueChange={(val) => updateCandidateStatus(c.id, val)}
                                    >
                                        <SelectTrigger className="w-[140px] h-8 text-xs font-semibold">
                                            <Badge variant={getStatusVariant(c.status || "APPLIED")} className="mr-2">
                                                {c.status || "APPLIED"}
                                            </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="APPLIED">Applied</SelectItem>
                                            <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                                            <SelectItem value="INTERVIEWED">Interviewed</SelectItem>
                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    {c.job.testEnabled ? (
                                        c.testScore !== undefined && c.testScore !== null ? (
                                            <Badge variant={c.testPassed ? "default" : "destructive"}>
                                                {c.testPassed ? "Passed" : "Failed"} ({c.testScore.toFixed(0)}%)
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Pending Test</Badge>
                                        )
                                    ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {c.flagged ? (
                                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                            <AlertCircle className="w-3 h-3" />
                                            Flagged ({c.tabSwitchCount || 0})
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Clear</span>
                                    )}
                                </TableCell>
                                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(c)}>
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No candidates found.
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
