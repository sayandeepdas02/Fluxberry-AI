import { z } from 'zod'

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export interface PaginatedResponse<T> {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> {
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}
