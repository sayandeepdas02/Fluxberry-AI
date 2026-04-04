"use client"

import { useQuery } from '@tanstack/react-query'
import { activityApi } from '@/lib/api/activity'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

export function CandidateTimeline({ candidateId }: { candidateId: string }) {
    const { data: response, isLoading } = useQuery({
        queryKey: ['activity', 'candidate', candidateId],
        queryFn: () => activityApi.list({ entityType: 'candidate', entityId: candidateId, limit: 50 }),
    })

    if (isLoading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const activities = response?.data || []

    if (activities.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-line rounded-lg mt-4">
                No timeline activity found.
            </div>
        )
    }

    return (
        <div className="mt-6 space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-line before:to-transparent">
            {activities.map((activity, index) => (
                <div key={activity._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-line bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                    </div>
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-line bg-card/50 shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                            <h4 className="font-semibold text-sm text-text-primary capitalize">
                                {activity.eventType.replace(/_/g, ' ').toLowerCase()}
                            </h4>
                            <time className="text-xs text-muted-foreground">
                                {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                            </time>
                        </div>
                        <p className="text-xs text-text-secondary">
                            {activity.performedBy
                                ? `By ${activity.performedBy.firstName} ${activity.performedBy.lastName}`
                                : 'By System'}
                        </p>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 bg-muted/40 p-2 rounded text-xs space-y-1 border border-line/50">
                                {Object.entries(activity.metadata).map(([k, v]) => (
                                    <div key={k} className="flex gap-2">
                                        <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                        <span className="font-medium truncate">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
