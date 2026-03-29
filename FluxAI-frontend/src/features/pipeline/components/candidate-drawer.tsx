import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { JobApplicationResponse } from "@/lib/api/applications";
import { Sparkles, FileText, CheckCircle2, XCircle, Clock, CalendarDays } from "lucide-react";
import { PipelineStage } from "@/lib/api/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CandidateDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: JobApplicationResponse | null;
    stages: PipelineStage[];
    onMoveStage: (id: string, stageId: string) => void;
}

export function CandidateDrawer({
    open,
    onOpenChange,
    candidate,
    stages,
    onMoveStage,
}: CandidateDrawerProps) {
    if (!candidate) return null;

    const candData = typeof candidate.candidateId === "object" ? candidate.candidateId : null;
    const name = candData ? `${candData.firstName || ""} ${candData.lastName || ""}`.trim() || candData.email : "Unknown";
    const initials = name.substring(0, 2).toUpperCase();

    const score = candidate.matchScore || 0;
    let scoreColorClass = "bg-primary/10 text-primary border-primary/20";
    if (score >= 85) scoreColorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    else if (score >= 70) scoreColorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    else if (score < 70) scoreColorClass = "bg-red-500/10 text-red-600 border-red-500/20";

    const currentStageId = typeof candidate.currentStageId === "object" 
        ? candidate.currentStageId._id 
        : candidate.currentStageId;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {/* Increase width for resume viewer space */}
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto p-0 flex flex-col gap-0 border-l border-line bg-background">
                {/* Fixed Header */}
                <div className="p-6 border-b border-line bg-card sticky top-0 z-20">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-none border border-line">
                                <AvatarFallback className="rounded-none text-xl bg-muted text-muted-foreground font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="text-2xl font-semibold mb-1">{name}</SheetTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{candData?.email}</span>
                                    <span>•</span>
                                    <span>Applied {new Date(candidate.submittedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="flex flex-col gap-2 items-end">
                            <select
                                value={currentStageId || ""}
                                onChange={(e) => onMoveStage(candidate._id, e.target.value)}
                                className="text-sm bg-card border border-line rounded-none px-3 py-1.5 focus:outline-none focus:border-primary w-40"
                            >
                                <option value="" disabled>Select Stage...</option>
                                {stages.map((stage) => (
                                    <option key={stage._id} value={stage._id}>
                                        Move to: {stage.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-8 flex-1">
                    {/* Section: AI Score & Summary */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                AI Evaluation
                            </h3>
                            <div className={`px-2 py-1 flex items-center gap-1.5 text-xs font-semibold border ${scoreColorClass}`}>
                                {score}% Match
                            </div>
                            {score >= 85 && (
                                <span className="px-2 py-1 text-[10px] font-medium bg-primary text-primary-foreground tracking-wide uppercase">
                                    Strong Fit
                                </span>
                            )}
                        </div>

                        {candidate.aiSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-line bg-muted/10 p-4 space-y-2">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Strengths
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                        {candidate.aiSummary.strengths.map((str, i) => <li key={i}>{str}</li>)}
                                    </ul>
                                </div>
                                <div className="border border-line bg-muted/10 p-4 space-y-2">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-red-500">
                                        <XCircle className="w-4 h-4" />
                                        Areas of Concern
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                        {candidate.aiSummary.weaknesses.map((wk, i) => <li key={i}>{wk}</li>)}
                                    </ul>
                                </div>
                                <div className="md:col-span-2 border border-line bg-muted/10 p-4 space-y-2">
                                    <h4 className="text-sm font-semibold">Fit Reasoning</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {candidate.aiSummary.fitReasoning}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Resume Viewer */}
                    <div className="space-y-4 flex-1 flex flex-col min-h-[500px]">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Resume
                        </h3>
                        <div className="flex-1 border border-line bg-muted/5 flex flex-col overflow-hidden relative">
                            {candidate.resumeUrl ? (
                                <iframe 
                                    src={`${candidate.resumeUrl}#toolbar=0`} 
                                    className="absolute inset-0 w-full h-full border-0"
                                    title="Resume PDF Viewer"
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                    <FileText className="w-12 h-12 mb-2 opacity-50" />
                                    <p>No resume attached</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Timeline (Mock) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Timeline & Activity
                        </h3>
                        <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-line">
                            <div className="relative">
                                <span className="absolute -left-6 bg-background border-2 border-primary w-3 h-3 rounded-full mt-1" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">Applied for Role</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarDays className="w-3 h-3" />
                                        {new Date(candidate.submittedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-6 bg-background border-2 border-line w-3 h-3 rounded-full mt-1" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">AI Screening Completed</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarDays className="w-3 h-3" />
                                        {new Date(new Date(candidate.submittedAt).getTime() + 1000 * 60 * 5).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
