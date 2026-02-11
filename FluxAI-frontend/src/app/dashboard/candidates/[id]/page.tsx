"use client";

import { use, useEffect, useState, useCallback } from "react";
import { candidatesApi, CandidateDetailResponse, CandidateNoteEntry } from "@/lib/api/candidates";
import { ApplicationStage } from "@/lib/api/applications";
import { Loader2, ArrowLeft, FileText, Send, Clock, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STAGE_COLORS: Record<string, string> = {
    APPLIED: "bg-blue-500/15 text-blue-400",
    SCREENING: "bg-amber-500/15 text-amber-400",
    INTERVIEW: "bg-purple-500/15 text-purple-400",
    OFFER: "bg-emerald-500/15 text-emerald-400",
    HIRED: "bg-green-500/15 text-green-400",
    REJECTED: "bg-red-500/15 text-red-400",
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CandidateDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [detail, setDetail] = useState<CandidateDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);

    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        const response = await candidatesApi.getById(id);
        if (response.success && response.data) {
            setDetail(response.data);
        } else {
            setError(response.error?.message || "Failed to load candidate");
        }
        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        setIsAddingNote(true);
        const response = await candidatesApi.addNote(id, noteContent.trim());
        if (response.success && response.data) {
            setDetail(prev => prev ? {
                ...prev,
                notes: [response.data!, ...prev.notes],
            } : prev);
            setNoteContent("");
        }
        setIsAddingNote(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-400">{error || "Candidate not found"}</p>
                <Link href="/dashboard" className="text-sm underline text-muted-foreground hover:text-foreground">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const { candidate, applications, notes, stageHistory } = detail;
    const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold">{fullName}</h1>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    </div>
                </div>

                {/* Three columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Candidate Info */}
                    <div className="space-y-4">
                        <div className="border border-edge rounded-lg p-4 bg-card space-y-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <User className="w-4 h-4" /> Profile
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span>{candidate.email}</span>
                                </div>
                                {candidate.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span>{candidate.phone}</span>
                                    </div>
                                )}
                                {candidate.source && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Source</span>
                                        <span>{candidate.source}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Added</span>
                                    <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Applications */}
                        <div className="border border-edge rounded-lg p-4 bg-card space-y-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Applications ({applications.length})
                            </h3>
                            {applications.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No applications</p>
                            ) : (
                                <div className="space-y-2">
                                    {applications.map((app) => (
                                        <div key={app._id} className="p-2 rounded-md bg-muted/30 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    {typeof app.jobId === 'object' ? app.jobId.title : 'Unknown Job'}
                                                </span>
                                                <span className={cn(
                                                    "text-xs px-1.5 py-0.5 rounded",
                                                    STAGE_COLORS[app.status] || "bg-muted text-muted-foreground"
                                                )}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Applied {new Date(app.submittedAt).toLocaleDateString()}
                                            </p>
                                            {app.resumeUrl && (
                                                <a
                                                    href={app.resumeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                                >
                                                    <FileText className="w-3 h-3" /> View Resume
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center: Stage Timeline */}
                    <div className="space-y-4">
                        <div className="border border-edge rounded-lg p-4 bg-card space-y-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Stage History
                            </h3>
                            {stageHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No stage transitions yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {stageHistory.map((entry) => (
                                        <div key={entry._id} className="relative pl-6 pb-3 border-l border-edge last:border-l-0">
                                            <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-foreground/30" />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {entry.fromStage && (
                                                        <>
                                                            <span className={cn("px-1.5 py-0.5 rounded text-xs", STAGE_COLORS[entry.fromStage])}>
                                                                {entry.fromStage}
                                                            </span>
                                                            <span className="text-muted-foreground">→</span>
                                                        </>
                                                    )}
                                                    <span className={cn("px-1.5 py-0.5 rounded text-xs", STAGE_COLORS[entry.toStage])}>
                                                        {entry.toStage}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    by {entry.changedBy?.firstName || 'System'} {entry.changedBy?.lastName || ''}
                                                    {' · '}{new Date(entry.changedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Application Data for first application */}
                        {applications.length > 0 && applications[0].applicationData && (
                            <div className="border border-edge rounded-lg p-4 bg-card space-y-3">
                                <h3 className="font-medium">Application Answers</h3>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(applications[0].applicationData).map(([key, value]) => (
                                        <div key={key} className="flex flex-col gap-0.5">
                                            <span className="text-muted-foreground text-xs uppercase tracking-wide">{key}</span>
                                            <span>{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Notes */}
                    <div className="space-y-4">
                        <div className="border border-edge rounded-lg p-4 bg-card space-y-3">
                            <h3 className="font-medium">Notes ({notes.length})</h3>

                            {/* Add note form */}
                            <form onSubmit={handleAddNote} className="flex gap-2">
                                <input
                                    type="text"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Add a note..."
                                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <button
                                    type="submit"
                                    disabled={!noteContent.trim() || isAddingNote}
                                    className="h-9 w-9 rounded-md bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors disabled:opacity-50"
                                >
                                    {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>

                            {/* Notes list */}
                            {notes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No notes yet</p>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {notes.map((note) => (
                                        <div key={note._id} className="p-3 rounded-md bg-muted/30 space-y-1">
                                            <p className="text-sm">{note.content}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {note.authorId?.firstName || 'Unknown'} {note.authorId?.lastName || ''} · {new Date(note.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
