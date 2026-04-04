"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { JobApplicationResponse } from '@/lib/api/applications'
import { format } from 'date-fns'
import { GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface KanbanCardProps {
    application: JobApplicationResponse
    onClick: () => void
}

export function KanbanCard({ application, onClick }: KanbanCardProps) {
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
            type: 'Application',
            application,
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const candidateName = typeof application.candidateId === 'object'
        ? `${application.candidateId.firstName || ''} ${application.candidateId.lastName || ''}`.trim() || 'Unknown Candidate'
        : 'Unknown Candidate'

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-start bg-card/60 backdrop-blur-sm border ${isDragging ? 'border-accent shadow-lg opacity-50 z-50' : 'border-line hover:border-line/80'
                } rounded-lg p-3 cursor-pointer shadow-sm transition-colors`}
            onClick={(e) => {
                // Determine if we clicked the drag handle to avoid double events
                const target = e.target as HTMLElement;
                if (!target.closest('.drag-handle')) {
                    onClick();
                }
            }}
        >
            <div
                {...attributes}
                {...listeners}
                className="drag-handle mr-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:text-accent outline-none text-muted-foreground shrink-0"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-text-primary truncate">
                        {candidateName}
                    </h4>
                    {application.matchScore !== undefined && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {application.matchScore}%
                        </Badge>
                    )}
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                    {format(new Date(application.submittedAt), 'MM/dd')}
                </div>
            </div>
        </div>
    )
}
