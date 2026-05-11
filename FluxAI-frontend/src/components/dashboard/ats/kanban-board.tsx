"use client"

import { useMemo, useState, useRef, useCallback } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiMutation } from '@/lib/hooks/use-api-mutation'
import { applicationsApi, JobApplicationResponse } from '@/lib/api/applications'
import { pipelineApi } from '@/lib/api/pipeline'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { useCandidatesStore } from '@/lib/store/candidates-store'
import { Loader2, X, MoveRight, UserX } from 'lucide-react'
import { CandidateDrawer } from '../candidates/candidate-drawer'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

export function KanbanBoard({ jobId }: { jobId: string }) {
    const queryClient = useQueryClient()
    const { setSelectedCandidate } = useCandidatesStore()
    const [activeApp, setActiveApp] = useState<JobApplicationResponse | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkTargetStageId, setBulkTargetStageId] = useState<string>('')

    const previousDataRef = useRef<any>(null)

    const { data: stagesResponse, isLoading: stagesLoading } = useQuery({
        queryKey: ['pipelineStages', jobId],
        queryFn: () => pipelineApi.getStages(jobId),
        enabled: !!jobId,
        refetchInterval: 15000,
    })

    const { data: appsResponse, isLoading: appsLoading } = useQuery({
        queryKey: ['applications', jobId],
        queryFn: () => applicationsApi.listByJob(jobId, { limit: 100 }),
        enabled: !!jobId,
        refetchInterval: 10000,
    })

    const stages = stagesResponse?.data || []
    const applications = appsResponse?.data || []
    const isReady = !stagesLoading && !appsLoading

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const moveStageMutation = useApiMutation({
        mutationFn: ({ appId, targetStageId }: { appId: string, targetStageId: string }) =>
            applicationsApi.moveStage(appId, targetStageId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['applications', jobId] })
            previousDataRef.current = queryClient.getQueryData(['applications', jobId])
        },
        onError: () => {
            if (previousDataRef.current) {
                queryClient.setQueryData(['applications', jobId], previousDataRef.current)
            }
        },
        errorMessage: 'Failed to move candidate — the stage change has been reverted. Please try again.',
        successMessage: 'Stage updated',
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['applications', jobId] })
            previousDataRef.current = null
        },
    })

    const bulkMoveMutation = useApiMutation({
        mutationFn: ({ ids, stageId }: { ids: string[]; stageId: string }) =>
            applicationsApi.bulkMove(ids, stageId),
        successMessage: (data) => `Moved ${data?.data?.updated ?? 0} candidate(s)`,
        errorMessage: 'Bulk move failed',
        invalidateKeys: [['applications', jobId]],
        onSuccess: () => { setSelectedIds(new Set()); setBulkTargetStageId('') },
    })

    const bulkRejectMutation = useApiMutation({
        mutationFn: ({ ids }: { ids: string[] }) =>
            applicationsApi.bulkUpdate({ applicationIds: ids, action: 'REJECT' }),
        successMessage: (data) => `Rejected ${data?.data?.updated ?? 0} candidate(s)`,
        errorMessage: 'Bulk reject failed',
        invalidateKeys: [['applications', jobId]],
        onSuccess: () => setSelectedIds(new Set()),
    })

    const handleSelect = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (checked) next.add(id); else next.delete(id)
            return next
        })
    }, [])

    const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Application') {
            setActiveApp(event.active.data.current.application)
        }
    }

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return
        const activeItem = active.data.current
        const overItem = over.data.current
        if (!activeItem || !overItem) return

        if (activeItem.type === 'Application') {
            const activeApp = activeItem.application as JobApplicationResponse
            const overColumnId = overItem.type === 'Column'
                ? overItem.stage._id
                : overItem.application.currentStageId?._id

            if (overColumnId && activeApp.currentStageId?._id !== overColumnId) {
                const targetStage = stages.find(s => s._id === overColumnId)
                queryClient.setQueryData(['applications', jobId], (old: any) => {
                    if (!old) return old
                    const newData = [...(old.data || [])]
                    const index = newData.findIndex((a: any) => a._id === activeApp._id)
                    if (index !== -1) {
                        newData[index] = {
                            ...newData[index],
                            currentStageId: targetStage
                                ? { _id: overColumnId, name: targetStage.name, type: targetStage.type, color: targetStage.color, order: targetStage.order }
                                : { _id: overColumnId, name: '', type: '', color: '', order: 0 }
                        }
                    }
                    return { ...old, data: newData }
                })
            }
        }
    }

    const onDragEnd = (event: DragEndEvent) => {
        setActiveApp(null)
        const { active, over } = event
        if (!over) return

        const app = active.data.current?.application as JobApplicationResponse
        const targetStageId = over.data.current?.type === 'Column'
            ? over.data.current?.stage._id
            : over.data.current?.application?.currentStageId?._id

        if (app && targetStageId && app.currentStageId?._id !== targetStageId) {
            moveStageMutation.mutate({ appId: app._id, targetStageId })
        }
    }

    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const selectedCount = selectedIds.size

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
                    {stages.map(stage => {
                        const stageApps = applications.filter(app => app.currentStageId?._id === stage._id)
                        return (
                            <KanbanColumn
                                key={stage._id}
                                stage={stage as any}
                                applications={stageApps}
                                onCardClick={(app) => {
                                    const cId = typeof app.candidateId === 'object' ? app.candidateId._id : app.candidateId
                                    setSelectedCandidate(cId)
                                }}
                                selectedIds={selectedIds}
                                onSelect={handleSelect}
                            />
                        )
                    })}
                </div>

                <DragOverlay>
                    {activeApp ? (
                        <div className="rotate-3 opacity-90 w-80">
                            <KanbanCard application={activeApp} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* ── Bulk Action Bar ────────────────────────────────── */}
            {selectedCount > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 bg-card border border-line rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom-2 duration-200">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    <div className="h-4 w-px bg-line" />
                    <div className="flex items-center gap-2">
                        <Select value={bulkTargetStageId} onValueChange={setBulkTargetStageId}>
                            <SelectTrigger className="h-8 w-44 text-xs bg-background border-line">
                                <SelectValue placeholder="Move to stage…" />
                            </SelectTrigger>
                            <SelectContent>
                                {stages.map(s => (
                                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <button
                            onClick={() => bulkTargetStageId && bulkMoveMutation.mutate({ ids: Array.from(selectedIds), stageId: bulkTargetStageId })}
                            disabled={!bulkTargetStageId || bulkMoveMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                            {bulkMoveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <MoveRight className="w-3 h-3" />}
                            Move
                        </button>
                    </div>
                    <div className="h-4 w-px bg-line" />
                    <button
                        onClick={() => bulkRejectMutation.mutate({ ids: Array.from(selectedIds) })}
                        disabled={bulkRejectMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
                    >
                        {bulkRejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                        Reject All
                    </button>
                    <button
                        onClick={clearSelection}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <CandidateDrawer />
        </>
    )
}
