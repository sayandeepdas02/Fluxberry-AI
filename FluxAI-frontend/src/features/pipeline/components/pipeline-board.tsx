import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { JobApplicationResponse } from "@/lib/api/applications";
import { PipelineStage } from "@/lib/api/types";
import { BoardColumn } from "./board-column";

interface PipelineBoardProps {
    applications: JobApplicationResponse[];
    stages: PipelineStage[];
    onCandidateClick: (app: JobApplicationResponse) => void;
    onMoveCandidate: (id: string, stageId: string) => Promise<boolean>;
}

export function PipelineBoard({
    applications,
    stages,
    onCandidateClick,
    onMoveCandidate,
}: PipelineBoardProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum distance before drag starts (allowing clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const candidateId = active.id as string;
        let newStageId = String(over.id);
        
        // If dropping onto a candidate sortable rather than the column, find the candidate's stage
        if (over.data?.current?.sortable) {
            const targetCandidate = applications.find(a => a._id === newStageId);
            if (targetCandidate) {
                newStageId = typeof targetCandidate.currentStageId === "object" 
                    ? targetCandidate.currentStageId._id 
                    : targetCandidate.currentStageId || "";
            }
        }

        const activeCandidate = applications.find(a => a._id === candidateId);
        const currentStageId = typeof activeCandidate?.currentStageId === "object" 
            ? activeCandidate.currentStageId._id 
            : activeCandidate?.currentStageId;

        // Skip if no change
        if (newStageId === currentStageId || !newStageId) {
            return;
        }

        // Fire mutation
        await onMoveCandidate(candidateId, newStageId);
    };

    return (
        <div className="flex h-[calc(100vh-280px)] overflow-x-auto overflow-y-hidden border border-line bg-card">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {stages.map((stage) => {
                    // Filter applications for this stage
                    const stageApps = applications.filter((app) => {
                        const appId = typeof app.currentStageId === "object"
                            ? app.currentStageId._id
                            : app.currentStageId;
                        return appId === stage._id || app.status === stage.type;
                    });

                    return (
                        <BoardColumn
                            key={stage._id}
                            stage={stage}
                            applications={stageApps}
                            onCandidateClick={onCandidateClick}
                        />
                    );
                })}
            </DndContext>
        </div>
    );
}
