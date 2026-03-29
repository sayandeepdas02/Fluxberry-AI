import React from "react";
import { JobApplicationResponse } from "@/lib/api/applications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Calendar } from "lucide-react";

export interface CandidateCardProps {
    application: JobApplicationResponse;
    onClick?: () => void;
    // For drag states
    isDragging?: boolean;
    style?: React.CSSProperties;
    attributes?: any;
    listeners?: any;
    setNodeRef?: (node: HTMLElement | null) => void;
}

export function CandidateCard({ 
    application, 
    onClick, 
    isDragging, 
    style, 
    attributes, 
    listeners, 
    setNodeRef 
}: CandidateCardProps) {
    const candidate = typeof application.candidateId === "object" ? application.candidateId : null;
    const name = candidate ? `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() || candidate.email : "Unknown";
    const initials = name.substring(0, 2).toUpperCase();

    // AI score badge color logic
    const score = application.matchScore || 0;
    let scoreColorClass = "bg-primary/10 text-primary border-primary/20";
    if (score >= 85) scoreColorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    else if (score >= 70) scoreColorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    else if (score < 70) scoreColorClass = "bg-red-500/10 text-red-600 border-red-500/20";

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`
                group
                bg-card border border-line p-4
                hover:border-primary/40 hover:shadow-sm
                transition-all cursor-grab active:cursor-grabbing
                ${isDragging ? "opacity-50 ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-md z-50" : ""}
            `}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 rounded-none border border-line">
                        <AvatarFallback className="rounded-none text-xs bg-muted text-muted-foreground font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground line-clamp-1">
                            {name}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                            {candidate?.email || "No email"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {/* AI Score Badge */}
                <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 flex items-center gap-1.5 text-xs font-semibold border ${scoreColorClass}`}>
                        <Sparkles className="w-3 h-3" />
                        {score}% Match
                    </div>
                    {score >= 85 && (
                        <div className="px-2 py-1 text-[10px] font-medium bg-primary text-primary-foreground tracking-wide uppercase">
                            Strong Fit
                        </div>
                    )}
                </div>

                {/* Tags */}
                {application.tags && application.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {application.tags.map((tag, i) => (
                            <span 
                                key={i} 
                                className="px-1.5 py-0.5 border border-line text-xs text-muted-foreground bg-muted/20"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Footer (Date) */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-line/50">
                    <Calendar className="w-3 h-3" />
                    Applied {new Date(application.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                </div>
            </div>
        </div>
    );
}
