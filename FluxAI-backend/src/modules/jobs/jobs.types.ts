import { z } from 'zod'

export const createJobSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    department: z.string().min(1, 'Department is required'),
    location: z.string().min(1, 'Location is required'),
    type: z.enum(['FULL_TIME', 'CONTRACT', 'INTERNSHIP', 'PART_TIME']),
    status: z.enum(['LIVE', 'CLOSED', 'DRAFT', 'PAUSED']).default('LIVE'),
    requirements: z.array(z.string()).optional(),
    salaryRange: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
        currency: z.string().default('USD')
    }).optional()
})

export const updateJobSchema = createJobSchema.partial()

export const listJobsQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    status: z.enum(['LIVE', 'CLOSED', 'DRAFT', 'PAUSED']).optional(),
    search: z.string().optional(),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>
