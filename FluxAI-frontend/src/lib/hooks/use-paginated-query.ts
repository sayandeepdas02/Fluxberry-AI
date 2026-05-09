'use client'

import { useState } from 'react'
import { useQuery, type QueryKey } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'
import { ApiError } from '@/lib/api/client'

export interface PaginatedMeta {
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface PaginatedResult<T> {
    data: T[]
    meta: PaginatedMeta
}

// ── usePaginatedQuery ─────────────────────────────────────────────────────────
//
// Manages page state and wraps useQuery for paginated list endpoints.
//
// Usage:
//   const { items, meta, page, setPage, isLoading, error } = usePaginatedQuery({
//     queryKey: (p) => ['jobs', p],
//     queryFn: (p) => jobsApi.list(p).then(unwrap),
//   })

interface UsePaginatedQueryOptions<TItem> {
    queryKey: (params: { page: number; limit: number }) => QueryKey
    queryFn: (params: { page: number; limit: number }) => Promise<PaginatedResult<TItem>>
    defaultLimit?: number
    staleTime?: number
    enabled?: boolean
}

export function usePaginatedQuery<TItem>({
    queryKey,
    queryFn,
    defaultLimit = 20,
    staleTime,
    enabled = true,
}: UsePaginatedQueryOptions<TItem>) {
    const [page, setPage] = useState(1)

    const params = { page, limit: defaultLimit }

    const { data, isLoading, error: rawError, refetch } = useQuery({
        queryKey: queryKey(params),
        queryFn: () => queryFn(params),
        staleTime,
        enabled,
    })

    const items: TItem[] = data?.data ?? []
    const meta: PaginatedMeta = data?.meta ?? { total: 0, page: 1, limit: defaultLimit, totalPages: 0 }
    const error: string | null = rawError ? (rawError as Error).message : null

    function goToPage(p: number) {
        setPage(Math.max(1, Math.min(p, meta.totalPages || 1)))
    }

    return { items, meta, page, setPage: goToPage, isLoading, error, refetch }
}

// ── useFilteredQuery ──────────────────────────────────────────────────────────
//
// Extends usePaginatedQuery with debounced search and arbitrary filter state.
// Resets page to 1 whenever search or any filter changes.
//
// Usage:
//   const { items, meta, search, setSearch, filters, setFilter, page, setPage, isLoading } =
//     useFilteredQuery({
//       queryKey: (p) => ['candidates', p],
//       queryFn: (p) => candidatesApi.list(p).then(unwrap),
//       defaultFilters: { status: '' },
//     })

interface UseFilteredQueryOptions<TItem, TFilters extends object = Record<string, string>> {
    queryKey: (params: TFilters & { search: string; page: number; limit: number }) => QueryKey
    queryFn: (params: TFilters & { search: string; page: number; limit: number }) => Promise<PaginatedResult<TItem>>
    defaultFilters?: TFilters
    defaultLimit?: number
    searchDebounce?: number
    staleTime?: number
    enabled?: boolean
}

export function useFilteredQuery<TItem, TFilters extends object = Record<string, string>>({
    queryKey,
    queryFn,
    defaultFilters,
    defaultLimit = 20,
    searchDebounce = 400,
    staleTime,
    enabled = true,
}: UseFilteredQueryOptions<TItem, TFilters>) {
    const [page, setPageRaw] = useState(1)
    const [search, setSearchRaw] = useState('')
    const [filters, setFiltersRaw] = useState<TFilters>(defaultFilters ?? ({} as TFilters))

    const debouncedSearch = useDebounce(search, searchDebounce)

    const params = {
        ...filters,
        search: debouncedSearch,
        page,
        limit: defaultLimit,
    }

    const { data, isLoading, error: rawError, refetch } = useQuery({
        queryKey: queryKey(params),
        queryFn: () => queryFn(params),
        staleTime,
        enabled,
    })

    const items: TItem[] = data?.data ?? []
    const meta: PaginatedMeta = data?.meta ?? { total: 0, page: 1, limit: defaultLimit, totalPages: 0 }
    const error: string | null = rawError ? (rawError as ApiError).message : null

    function setSearch(value: string) {
        setSearchRaw(value)
        setPageRaw(1)
    }

    function setFilter<K extends keyof TFilters>(key: K, value: TFilters[K]) {
        setFiltersRaw(prev => ({ ...prev, [key]: value }))
        setPageRaw(1)
    }

    function setFilters(updates: Partial<TFilters>) {
        setFiltersRaw(prev => ({ ...prev, ...updates }))
        setPageRaw(1)
    }

    function goToPage(p: number) {
        setPageRaw(Math.max(1, Math.min(p, meta.totalPages || 1)))
    }

    return {
        items,
        meta,
        search,
        setSearch,
        debouncedSearch,
        filters,
        setFilter,
        setFilters,
        page,
        setPage: goToPage,
        isLoading,
        error,
        refetch,
    }
}
