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
})

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>
export type ListCandidatesQuery = z.infer<typeof listCandidatesQuerySchema>
