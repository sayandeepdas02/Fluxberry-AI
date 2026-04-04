import { apiClient } from './client'
import { ApiResponse } from './types'

export interface ActivityLog {
    _id: string
    organizationId: string
    entityType: string
    entityId: string
    eventType: string
    actorType: 'user' | 'system' | 'ai'
    performedBy?: { _id: string; firstName: string; lastName: string; email: string }
    metadata?: Record<string, any>
    timestamp: string
}

export interface ListActivityQuery {
    page?: number
    limit?: number
    entityType?: string
    entityId?: string
    actorType?: string
}

export const activityApi = {
    list: async (query?: ListActivityQuery): Promise<ApiResponse<ActivityLog[]>> => {
        return apiClient.get('/activity', query as Record<string, string>)
    }
}
