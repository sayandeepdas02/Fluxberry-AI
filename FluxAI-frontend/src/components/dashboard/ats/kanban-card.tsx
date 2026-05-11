"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { JobApplicationResponse } from '@/lib/api/applications'
import { format, differenceInDays } from 'date-fns'
import { GripVertical, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
    application: JobApplicationResponse
    onClick: () => void
    isSelected?: boolean
    onSelect?: (id: string, checked: boolean) => void
}

function AgingBadge({ stageEnteredAt, submittedAt }: { stageEnteredAt?: string; submittedAt: string }) {
    const referenceDate = stageEnteredAt || submittedAt
    const days = differenceInDays(new Date(), new Date(referenceDate))

    if (days < 1) return null

    const isStale = days >= 7
    const isWarning = days >= 3 && days < 7

    return (
        <span className={cn(
            'flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded',
            isStale ? 'bg-red-500/10 text-red-400' :
            isWarning ? 'bg-amber-500/10 text-amber-400' :
            'bg-muted text-muted-foreground'
        )}>
            <Clock className="w-2.5 h-2.5" />
            {days}d
        </span>
    )
}

export function KanbanCard({ application, onClick, isSelected, onSelect }: KanbanCardProps) {
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
            className={cn(
                'group flex items-start bg-card/60 backdrop-blur-sm border rounded-lg p-3 cursor-pointer shadow-sm transition-colors',
                isDragging ? 'border-accent shadow-lg opacity-50 z-50' :
                isSelected ? 'border-accent/60 bg-accent/5' :
                'border-line hover:border-line/80'
            )}
            onClick={(e) => {
                const target = e.target as HTMLElement
                if (!target.closest('.drag-handle') && !target.closest('.select-checkbox')) {
                    onClick()
                }
            }}
        >
            {/* Selection checkbox */}
            {onSelect && (
                <div
                    className="select-checkbox mr-2 mt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(application._id, e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-line cursor-pointer accent-[hsl(var(--accent))]"
                    />
                </div>
            )}

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
                    <div className="flex items-center gap-1 shrink-0">
                        <AgingBadge
                            stageEnteredAt={application.stageEnteredAt}
                            submittedAt={application.submittedAt}
                        />
                        {application.matchScore !== undefined && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                {application.matchScore}%
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                    {format(new Date(application.submittedAt), 'MM/dd')}
                </div>
            </div>
        </div>
    )
}
