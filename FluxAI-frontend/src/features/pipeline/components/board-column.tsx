import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { JobApplicationResponse } from "@/lib/api/applications";
import { CandidateCard } from "./candidate-card";
import { PipelineStage } from "@/lib/api/types";
import { SortableCandidate } from "./sortable-candidate";

interface BoardColumnProps {
    stage: PipelineStage;
    applications: JobApplicationResponse[];
    onCandidateClick: (app: JobApplicationResponse) => void;
}

export function BoardColumn({ stage, applications, onCandidateClick }: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage._id,
    });

    return (
        <div className="flex flex-col w-[340px] shrink-0 h-full border-r border-line bg-muted/5">
            {/* Column Header */}
            <div className="flex items-center justify-between p-4 border-b border-line bg-background/50 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: stage.color }} 
                    />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                        {stage.name}
                    </h3>
                </div>
                <div className="px-2 py-0.5 rounded-none border border-line bg-muted text-xs font-medium text-muted-foreground">
                    {applications.length}
                </div>
            </div>

            {/* Droppable Area */}
            <div 
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-4 space-y-3 transition-colors ${isOver ? "bg-muted/30" : ""}`}
            >
                <SortableContext 
                    items={applications.map(a => a._id)} 
                    strategy={verticalListSortingStrategy}
                >
                    {applications.map(app => (
                        <SortableCandidate 
                            key={app._id} 
                            application={app} 
                            onClick={() => onCandidateClick(app)} 
                        />
                    ))}
                </SortableContext>
                
                {applications.length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-line p-4 text-center">
                        <span className="text-sm text-muted-foreground/60">
                            Drop candidates here
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
