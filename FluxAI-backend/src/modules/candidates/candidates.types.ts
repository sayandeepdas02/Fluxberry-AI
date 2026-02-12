import { z } from 'zod'

export const createCandidateSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    source: z.string().optional(),
})

export const updateCandidateSchema = createCandidateSchema.partial()

export const listCandidatesQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    search: z.string().optional(),
    source: z.string().optional(),
    jobId: z.string().optional(),
    stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    tags: z.string().optional(), // Comma-separated tags
})

export const createNoteSchema = z.object({
    content: z.string().min(1).max(5000),
})

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>

