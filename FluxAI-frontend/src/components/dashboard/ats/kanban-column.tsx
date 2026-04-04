"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { JobApplicationResponse } from '@/lib/api/applications'
import { KanbanCard } from './kanban-card'
import { PipelineStage } from '@/lib/api/types'
import { useMemo } from 'react'

interface KanbanColumnProps {
    stage: PipelineStage
    applications: JobApplicationResponse[]
    onCardClick: (app: JobApplicationResponse) => void
}

export function KanbanColumn({ stage, applications, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage._id,
        data: {
            type: 'Column',
            stage,
        }
    })

    const applicationIds = applications.map(app => app._id)

    // Compute lightweight metrics
    const metrics = useMemo(() => {
        const scored = applications.filter(a => a.matchScore !== undefined && a.matchScore !== null)
        const avgScore = scored.length > 0
            ? Math.round(scored.reduce((sum, a) => sum + (a.matchScore || 0), 0) / scored.length)
            : null
        return { count: applications.length, avgScore }
    }, [applications])

    return (
        <div className="flex flex-col w-80 shrink-0 h-full rounded-lg bg-card/20 border border-line overflow-hidden">
            {/* ── Column Header ──────────────────────────────────── */}
            <div className="p-3 border-b border-line bg-card/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: stage.color || '#3b82f6' }}
                        />
                        <h3 className="font-semibold text-sm select-none">{stage.name}</h3>
                    </div>
                    <div className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground select-none">
                        {metrics.count}
                    </div>
                </div>
                {/* Stage metrics row */}
                {metrics.count > 0 && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/70">
                        <span>{metrics.count} {metrics.count === 1 ? 'candidate' : 'candidates'}</span>
                        {metrics.avgScore !== null && (
                            <>
                                <span className="text-line">·</span>
                                <span className={`font-medium ${
                                    metrics.avgScore >= 75 ? 'text-emerald-400' :
                                    metrics.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    Avg Score: {metrics.avgScore}%
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Droppable Area ─────────────────────────────────── */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-2 overflow-y-auto space-y-2 transition-colors ${isOver ? 'bg-accent/5 ring-1 ring-inset ring-accent/20' : ''
                    }`}
            >
                <SortableContext items={applicationIds} strategy={verticalListSortingStrategy}>
                    {applications.map(app => (
                        <KanbanCard
                            key={app._id}
                            application={app}
                            onClick={() => onCardClick(app)}
                        />
                    ))}
                </SortableContext>
                
                {applications.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-line/50 rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground select-none gap-1">
                        <span>Drop candidate here</span>
                        <span className="text-[10px] text-muted-foreground/50">or drag from another stage</span>
                    </div>
                )}
            </div>
        </div>
    )
}
