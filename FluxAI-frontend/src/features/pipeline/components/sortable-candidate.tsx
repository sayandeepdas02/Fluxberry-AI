import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CandidateCard, CandidateCardProps } from "./candidate-card";

export function SortableCandidate({ application, onClick }: Omit<CandidateCardProps, "isDragging" | "style" | "attributes" | "listeners" | "setNodeRef">) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: application._id,
        data: {
            application,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <CandidateCard
            setNodeRef={setNodeRef}
            style={style}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
            application={application}
            onClick={onClick}
        />
    );
}
