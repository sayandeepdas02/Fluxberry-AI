import { z } from 'zod'

export const listApplicationsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).optional(),
    search: z.string().optional(),
    sort: z.enum(['appliedAt', '-appliedAt', 'name', '-name']).default('-appliedAt'),
})

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>

export const updateStageSchema = z.object({
    stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']),
})

export type UpdateStageInput = z.infer<typeof updateStageSchema>

export const bulkUpdateSchema = z.object({
    applicationIds: z.array(z.string()).min(1).max(100),
    action: z.enum(['MOVE_STAGE', 'REJECT']),
    stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).optional(),
}).refine(
    (data) => data.action !== 'MOVE_STAGE' || data.stage !== undefined,
    { message: 'stage is required when action is MOVE_STAGE', path: ['stage'] }
)

export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>
