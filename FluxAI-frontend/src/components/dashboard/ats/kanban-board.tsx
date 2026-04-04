"use client"

import { useMemo, useState, useRef } from 'react'
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, JobApplicationResponse } from '@/lib/api/applications'
import { pipelineApi } from '@/lib/api/pipeline'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { useCandidatesStore } from '@/lib/store/candidates-store'
import { Loader2 } from 'lucide-react'
import { CandidateDrawer } from '../candidates/candidate-drawer'
import { toast } from 'sonner'

export function KanbanBoard({ jobId }: { jobId: string }) {
    const queryClient = useQueryClient()
    const { setSelectedCandidate } = useCandidatesStore()
    const [activeApp, setActiveApp] = useState<JobApplicationResponse | null>(null)

    // Snapshot for rollback on failed optimistic updates
    const previousDataRef = useRef<any>(null)

    // Fetch initial data with polling
    const { data: stagesResponse, isLoading: stagesLoading } = useQuery({
        queryKey: ['pipelineStages', jobId],
        queryFn: () => pipelineApi.getStages(jobId),
        enabled: !!jobId,
        refetchInterval: 15000, // Poll every 15s
    })

    const { data: appsResponse, isLoading: appsLoading } = useQuery({
        queryKey: ['applications', jobId],
        queryFn: () => applicationsApi.listByJob(jobId, { limit: 100 }),
        enabled: !!jobId,
        refetchInterval: 10000, // Poll every 10s for faster pipeline updates
    })

    const stages = stagesResponse?.data || []
    const applications = appsResponse?.data || []

    const isReady = !stagesLoading && !appsLoading

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Mutation with proper error handling + rollback
    const moveStageMutation = useMutation({
        mutationFn: ({ appId, targetStageId }: { appId: string, targetStageId: string }) =>
            applicationsApi.moveStage(appId, targetStageId),
        onMutate: async () => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['applications', jobId] })
            // Snapshot current data for rollback
            previousDataRef.current = queryClient.getQueryData(['applications', jobId])
        },
        onError: (_err, _vars, _ctx) => {
            // Rollback to snapshot
            if (previousDataRef.current) {
                queryClient.setQueryData(['applications', jobId], previousDataRef.current)
            }
            toast.error('Failed to move candidate', {
                description: 'The stage change has been reverted. Please try again.',
            })
        },
        onSuccess: () => {
            toast.success('Stage updated', { duration: 2000 })
        },
        onSettled: () => {
            // Always refetch after mutation settles to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['applications', jobId] })
            previousDataRef.current = null
        },
    })

    // Handler: Drive optimistic updates
    const onDragStart = (event: DragStartEvent) => {
        const { active } = event
        if (active.data.current?.type === 'Application') {
            setActiveApp(active.data.current.application)
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
                // Find the real stage data for the target column
                const targetStage = stages.find(s => s._id === overColumnId)
                
                // Optimistically update
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

        const activeApp = active.data.current?.application as JobApplicationResponse
        const targetStageId = over.data.current?.type === 'Column'
            ? over.data.current?.stage._id
            : over.data.current?.application?.currentStageId?._id

        if (activeApp && targetStageId && activeApp.currentStageId?._id !== targetStageId) {
            moveStageMutation.mutate({ appId: activeApp._id, targetStageId })
        }
    }

    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

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

            <CandidateDrawer />
        </>
    )
}
