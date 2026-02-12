
import { apiClient } from './client'

export interface AuditLog {
    _id: string
    organizationId: string
    entityType: string
    entityId: string
    action: string
    previousValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    performedBy: {
        _id: string
        firstName: string
        lastName: string
        email: string
    }
    createdAt: string
}

export interface ListAuditLogsQuery {
    page?: number
    limit?: number
    entityType?: string
    action?: string
    userId?: string
}

export const auditApi = {
    list: async (query: ListAuditLogsQuery) => {
        const response = await apiClient.get<{
            logs: AuditLog[]
            total: number
            page: number
            totalPages: number
        }>('/audit-logs', query)

        if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to fetch audit logs')
        }
        return response.data
    },
}
