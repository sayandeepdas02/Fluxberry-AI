import { apiClient } from './client'

export interface TalentPool {
    _id: string
    organizationId: string
    createdBy: string
    name: string
    description?: string
    color?: string
    candidateIds: string[]
    candidateCount: number
    isSmartList: boolean
    smartListQuery?: {
        search?: string
        tags?: string[]
        source?: string
        minScore?: number
        dateFrom?: string
        dateTo?: string
    }
    createdAt: string
    updatedAt: string
}

export interface SavedSearch {
    _id: string
    organizationId: string
    createdBy: string
    name: string
    query: { search?: string; tags?: string[]; source?: string; dateFrom?: string; dateTo?: string }
    alertEnabled: boolean
    lastRunAt?: string
    createdAt: string
    updatedAt: string
}

export interface FollowUpReminder {
    _id: string
    organizationId: string
    createdBy: string
    candidateId: string | { _id: string; firstName?: string; lastName?: string; email: string }
    applicationId?: string
    note: string
    dueAt: string
    done: boolean
    completedAt?: string
    createdAt: string
    updatedAt: string
}

export interface CandidateBookmark {
    _id: string
    organizationId: string
    userId: string
    candidateId: string | { _id: string; firstName?: string; lastName?: string; email: string; tags?: string[] }
    note?: string
    createdAt: string
}

export const talentCRMApi = {
    // Pools
    listPools: (params?: { page?: number; limit?: number; search?: string }) =>
        apiClient.get<{ data: TalentPool[]; meta: any }>('/talent-crm/pools', params as any),
    createPool: (data: Partial<TalentPool>) =>
        apiClient.post<TalentPool>('/talent-crm/pools', data),
    getPool: (id: string) =>
        apiClient.get<TalentPool>(`/talent-crm/pools/${id}`),
    updatePool: (id: string, data: Partial<TalentPool>) =>
        apiClient.patch<TalentPool>(`/talent-crm/pools/${id}`, data),
    deletePool: (id: string) =>
        apiClient.delete(`/talent-crm/pools/${id}`),
    getPoolCandidates: (id: string, params?: { page?: number; limit?: number }) =>
        apiClient.get<{ data: any[]; meta: any }>(`/talent-crm/pools/${id}/candidates`, params as any),
    addCandidates: (id: string, candidateIds: string[]) =>
        apiClient.post<TalentPool>(`/talent-crm/pools/${id}/candidates/add`, { candidateIds }),
    removeCandidates: (id: string, candidateIds: string[]) =>
        apiClient.post<TalentPool>(`/talent-crm/pools/${id}/candidates/remove`, { candidateIds }),

    // Saved Searches
    listSavedSearches: () =>
        apiClient.get<SavedSearch[]>('/talent-crm/saved-searches'),
    createSavedSearch: (data: { name: string; query: SavedSearch['query']; alertEnabled?: boolean }) =>
        apiClient.post<SavedSearch>('/talent-crm/saved-searches', data),
    deleteSavedSearch: (id: string) =>
        apiClient.delete(`/talent-crm/saved-searches/${id}`),
    runSavedSearch: (id: string, params?: { page?: number; limit?: number }) =>
        apiClient.post<{ data: any[]; meta: any }>(`/talent-crm/saved-searches/${id}/run`, params || {}),

    // Reminders
    listReminders: (filter?: 'overdue' | 'upcoming' | 'done') =>
        apiClient.get<FollowUpReminder[]>('/talent-crm/reminders', filter ? { filter } : undefined),
    createReminder: (data: { candidateId: string; applicationId?: string; note: string; dueAt: string }) =>
        apiClient.post<FollowUpReminder>('/talent-crm/reminders', data),
    completeReminder: (id: string) =>
        apiClient.post<FollowUpReminder>(`/talent-crm/reminders/${id}/complete`, {}),
    deleteReminder: (id: string) =>
        apiClient.delete(`/talent-crm/reminders/${id}`),

    // Bookmarks
    listBookmarks: () =>
        apiClient.get<CandidateBookmark[]>('/talent-crm/bookmarks'),
    bookmarkCandidate: (candidateId: string, note?: string) =>
        apiClient.post<CandidateBookmark>(`/talent-crm/bookmarks/${candidateId}`, { note }),
    removeBookmark: (candidateId: string) =>
        apiClient.delete(`/talent-crm/bookmarks/${candidateId}`),
}
