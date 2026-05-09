'use client'

import {
    useMutation,
    useQueryClient,
    type UseMutationOptions,
    type UseMutationResult,
    type QueryKey,
} from '@tanstack/react-query'
import { toast } from 'sonner'

interface UseApiMutationOptions<TData, TError extends Error, TVariables, TContext = unknown>
    extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess' | 'onError'> {
    /** Toast shown on success. Omit to show no toast. */
    successMessage?: string | ((data: TData, variables: TVariables) => string)
    /**
     * Fallback error message when the thrown error has no message.
     * If omitted and the error has a message, that message is shown.
     */
    errorMessage?: string
    /** Query keys to invalidate on success, before onSuccess fires. */
    invalidateKeys?: QueryKey[]
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void
}

/**
 * Drop-in replacement for useMutation that handles:
 * - Auto toast on success / error
 * - Query invalidation on success
 * - Consistent error message extraction
 *
 * Usage:
 *   const create = useApiMutation({
 *     mutationFn: (data) => jobsApi.create(data),
 *     successMessage: 'Job created',
 *     invalidateKeys: [['jobs']],
 *   })
 */
export function useApiMutation<
    TData = unknown,
    TError extends Error = Error,
    TVariables = void,
    TContext = unknown,
>(
    options: UseApiMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
    const queryClient = useQueryClient()
    const { successMessage, errorMessage, invalidateKeys, onSuccess, onError, ...rest } = options

    return useMutation<TData, TError, TVariables, TContext>({
        ...rest,
        onSuccess: async (data, variables, context) => {
            if (invalidateKeys?.length) {
                await Promise.all(
                    invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
                )
            }
            if (successMessage) {
                const msg =
                    typeof successMessage === 'function'
                        ? successMessage(data, variables)
                        : successMessage
                toast.success(msg)
            }
            await onSuccess?.(data, variables, context)
        },
        onError: (error, variables, context) => {
            const msg = error?.message || errorMessage || 'Something went wrong. Please try again.'
            toast.error(msg)
            onError?.(error, variables, context)
        },
    })
}
