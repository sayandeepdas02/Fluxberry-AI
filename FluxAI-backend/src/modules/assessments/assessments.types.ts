import { z } from 'zod'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const createAssessmentSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    jobId: z.string().optional(),
})

export const updateAssessmentSchema = z.object({
    title: z.string().min(1).optional(),
    jobId: z.string().nullable().optional(),
})

export const mcqRoundConfigSchema = z.object({
    singleCorrectQuestionIds: z.array(z.string()).length(20, 'MCQ requires exactly 20 single-correct questions'),
    multiCorrectQuestionIds: z.array(z.string()).length(10, 'MCQ requires exactly 10 multi-correct questions'),
})

export const dsaRoundConfigSchema = z.object({
    questionIds: z.array(z.string()).length(4, 'DSA requires exactly 4 questions'),
})

export const aiRoundConfigSchema = z.object({
    agentId: z.string().min(1, 'AI round requires exactly 1 agent'),
})

export const roundConfigSchema = z.object({
    MCQ: z.object({
        enabled: z.boolean(),
        order: z.number().int().min(1),
        config: mcqRoundConfigSchema.nullable(),
    }).optional(),
    DSA: z.object({
        enabled: z.boolean(),
        order: z.number().int().min(1),
        config: dsaRoundConfigSchema.nullable(),
    }).optional(),
    AI: z.object({
        enabled: z.boolean(),
        order: z.number().int().min(1),
        config: aiRoundConfigSchema.nullable(),
    }).optional(),
})

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>
export type MCQRoundConfig = z.infer<typeof mcqRoundConfigSchema>
export type DSARoundConfig = z.infer<typeof dsaRoundConfigSchema>
export type AIRoundConfig = z.infer<typeof aiRoundConfigSchema>
export type RoundConfigInput = z.infer<typeof roundConfigSchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface RoundResponse {
    id: string
    roundType: 'MCQ' | 'DSA' | 'AI'
    enabled: boolean
    order: number
    config: MCQRoundConfig | DSARoundConfig | AIRoundConfig | null
}

export interface AssessmentResponse {
    id: string
    organizationId: string
    jobId: string | null
    title: string
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
    rounds: RoundResponse[]
    createdAt: Date
    updatedAt: Date
}

export interface AssessmentListResponse {
    data: AssessmentResponse[]
    total: number
}
