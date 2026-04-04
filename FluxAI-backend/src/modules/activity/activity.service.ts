import { ActivityLog, IActivityLog } from '../../database/models/index.js'
import { ListActivityQuery, ActivityFilter } from './activity.types.js'

class ActivityService {
    /**
     * Create a new activity log entry
     */
    async log(params: {
        organizationId: string
        entityType: string
        entityId: string
        eventType: string
        actorType?: 'user' | 'system' | 'ai'
        performedBy?: string
        metadata?: Record<string, any>
    }): Promise<void> {
        try {
            await ActivityLog.create({
                organizationId: params.organizationId,
                entityType: params.entityType,
                entityId: params.entityId,
                eventType: params.eventType,
                actorType: params.actorType || 'system',
                performedBy: params.performedBy,
                metadata: params.metadata,
                timestamp: new Date()
            })
        } catch (err) {
            console.error('[ActivityService] Failed to create activity log:', err)
        }
    }

    /**
     * Query activities with pagination
     */
    async list(organizationId: string, query: ListActivityQuery): Promise<{ activities: IActivityLog[], total: number, page: number, limit: number }> {
        const { page = 1, limit = 50, entityType, entityId, actorType } = query
        const skip = (page - 1) * limit
        
        const filter: any = { organizationId }
        if (entityType) filter.entityType = entityType
        if (entityId) filter.entityId = entityId
        if (actorType) filter.actorType = actorType

        const [activities, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('performedBy', 'firstName lastName email')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(filter)
        ])

        return { activities, total, page, limit }
    }
}

export const activityService = new ActivityService()
