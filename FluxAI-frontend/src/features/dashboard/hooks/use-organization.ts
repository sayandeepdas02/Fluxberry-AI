'use client'

import { useQuery } from '@tanstack/react-query'
import { organizationsApi, OrganizationMember } from '@/lib/api/organizations'
import { apiClient, ApiError } from '@/lib/api/client'
import { useApiMutation } from '@/lib/hooks/use-api-mutation'

const MEMBERS_KEY = ['organization', 'members'] as const

export function useOrganization() {
    const query = useQuery({
        queryKey: MEMBERS_KEY,
        queryFn: async () => {
            const res = await organizationsApi.getCurrentMembers()
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to load organization members', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        staleTime: 2 * 60 * 1000,
    })

    const members: OrganizationMember[] = query.data ?? []

    return {
        members,
        memberCount: members.length,
        isLoading: query.isLoading,
        error: query.error ? (query.error as Error).message : null,
        refetch: query.refetch,
    }
}

export function useUpdateWorkspace() {
    return useApiMutation({
        mutationFn: async (name: string) => {
            const res = await apiClient.patch<{ name: string }>('/organizations/workspace', { name })
            if (!res.success) throw new ApiError(res.error?.message ?? 'Failed to update workspace name', res.error?.code ?? 'UNKNOWN', res.error?.details)
            return res.data!
        },
        successMessage: 'Workspace name updated',
        invalidateKeys: [MEMBERS_KEY],
    })
}
