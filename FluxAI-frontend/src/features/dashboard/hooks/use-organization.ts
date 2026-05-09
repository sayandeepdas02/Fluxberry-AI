'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsApi, OrganizationMember } from '@/lib/api/organizations'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'

const MEMBERS_KEY = ['organization', 'members'] as const

export function useOrganization() {
    const query = useQuery({
        queryKey: MEMBERS_KEY,
        queryFn: async () => {
            const res = await organizationsApi.getCurrentMembers()
            if (!res.success) throw new Error(res.error?.message ?? 'Failed to load organization members')
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
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (name: string) => {
            const res = await apiClient.patch<{ name: string }>('/organizations/workspace', { name })
            if (!res.success) throw new Error(res.error?.message ?? 'Failed to update workspace name')
            return res.data!
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY })
            toast.success('Workspace name updated')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to update workspace name')
        },
    })
}
