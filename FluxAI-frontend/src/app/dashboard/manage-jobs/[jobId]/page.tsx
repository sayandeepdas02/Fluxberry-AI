"use client";

import * as React from "react";
import { use, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FileText, Search, ChevronDown, X, Loader2 } from "lucide-react";
import { useApplications } from "@/features/jobs/hooks/use-applications";
import { ApplicationStage, JobApplicationResponse } from "@/lib/api/applications";
import Link from "next/link";

const STAGES: { label: string; value: ApplicationStage | undefined }[] = [
    { label: "All", value: undefined },
    { label: "Applied", value: "APPLIED" },
    { label: "Screening", value: "SCREENING" },
    { label: "Interview", value: "INTERVIEW" },
    { label: "Offer", value: "OFFER" },
    { label: "Hired", value: "HIRED" },
    { label: "Rejected", value: "REJECTED" },
];

const STAGE_COLORS: Record<ApplicationStage, string> = {
    APPLIED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    SCREENING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    INTERVIEW: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    OFFER: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    HIRED: "bg-green-500/15 text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/15 text-red-400 border-red-500/20",
};

function StageBadge({ stage }: { stage: ApplicationStage }) {
    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
            STAGE_COLORS[stage]
        )}>
            {stage}
        </span>
    );
}

function getCandidateInfo(app: JobApplicationResponse) {
    const candidate = typeof app.candidateId === 'object' ? app.candidateId : null;
    return {
        name: candidate ? `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email : 'Unknown',
        email: candidate?.email || '',
        phone: candidate?.phone || '',
        resumeUrl: candidate?.resumeUrl || app.resumeUrl || '',
    };
}

interface PageProps {
    params: Promise<{ jobId: string }>;
}

export default function JobApplicantsPage({ params }: PageProps) {
    const { jobId } = use(params);
    const {
        applications,
        total,
        isLoading,
        error,
        stageFilter,
        search,
        setStageFilter,
        setSearch,
        updateStage,
        bulkUpdate,
        refetch,
    } = useApplications(jobId);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkStage, setBulkStage] = useState<ApplicationStage | ''>('');
    const [showBulkDropdown, setShowBulkDropdown] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === applications.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(applications.map(a => a._id)));
        }
    };

    const handleBulkMoveStage = async (stage: ApplicationStage) => {
        if (selected.size === 0) return;
        await bulkUpdate({
            applicationIds: Array.from(selected),
            action: 'MOVE_STAGE',
            stage,
        });
        setSelected(new Set());
        setShowBulkDropdown(false);
    };

    const handleBulkReject = async () => {
        if (selected.size === 0) return;
        await bulkUpdate({
            applicationIds: Array.from(selected),
            action: 'REJECT',
        });
        setSelected(new Set());
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleStageChange = async (appId: string, newStage: ApplicationStage) => {
        await updateStage(appId, newStage);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <Link href="/dashboard/manage-jobs" className="hover:text-foreground transition-colors">
                        Manage Jobs
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">Applicants</span>
                </div>

                {/* Stage filter tabs */}
                <div className="border-b border-edge">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {STAGES.map(({ label, value }) => (
                            <button
                                key={label}
                                onClick={() => setStageFilter(value)}
                                className={cn(
                                    "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                    stageFilter === value
                                        ? "border-foreground text-foreground"
                                        : "border-transparent text-muted-foreground hover:text-foreground/80"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary + Search + Bulk Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-medium">
                            Total: {total}
                        </h2>
                        {selected.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {selected.size} selected
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-edge bg-card hover:bg-muted/50 transition-colors"
                                    >
                                        Move Stage <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {showBulkDropdown && (
                                        <div className="absolute top-full left-0 mt-1 w-40 bg-card border border-edge rounded-md shadow-lg z-10">
                                            {STAGES.filter(s => s.value).map(({ label, value }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => handleBulkMoveStage(value!)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleBulkReject}
                                    className="px-3 py-1.5 text-sm rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full h-9 rounded-md border border-input bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearchInput(''); setSearch(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                        )}
                    </form>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <p className="text-sm text-red-400">{error}</p>
                        <button onClick={() => refetch()} className="text-sm text-muted-foreground hover:text-foreground underline">
                            Retry
                        </button>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <p className="text-muted-foreground">No applications found</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                            {stageFilter ? `No applications in "${stageFilter}" stage` : 'No applications for this job yet'}
                        </p>
                    </div>
                ) : (
                    <div className="border border-edge rounded-lg overflow-hidden bg-background">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selected.size === applications.length && applications.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded border-input"
                                        />
                                    </TableHead>
                                    <TableHead className="text-muted-foreground/70 font-normal">Candidate</TableHead>
                                    <TableHead className="text-muted-foreground/70 font-normal">Email</TableHead>
                                    <TableHead className="text-muted-foreground/70 font-normal">Stage</TableHead>
                                    <TableHead className="text-muted-foreground/70 font-normal">Applied</TableHead>
                                    <TableHead className="text-center text-muted-foreground/70 font-normal">Resume</TableHead>
                                    <TableHead className="text-muted-foreground/70 font-normal">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => {
                                    const info = getCandidateInfo(app);
                                    return (
                                        <TableRow key={app._id} className={cn(
                                            "hover:bg-muted/20 border-edge",
                                            selected.has(app._id) && "bg-muted/10"
                                        )}>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(app._id)}
                                                    onChange={() => toggleSelect(app._id)}
                                                    className="rounded border-input"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {info.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {info.email}
                                            </TableCell>
                                            <TableCell>
                                                <StageBadge stage={app.status} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(app.submittedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {info.resumeUrl ? (
                                                    <a
                                                        href={info.resumeUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground/30">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleStageChange(app._id, e.target.value as ApplicationStage)}
                                                    className="text-xs bg-card border border-edge rounded px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                                >
                                                    {STAGES.filter(s => s.value).map(({ label, value }) => (
                                                        <option key={value} value={value}>{label}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
