import { z } from 'zod'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const createProctoringEventSchema = z.object({
    roundType: z.enum(['MCQ', 'DSA', 'AI']).optional(),
    eventType: z.enum(['TAB_SWITCH', 'FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'MIC_MUTED', 'FULLSCREEN_EXIT']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
})

export type CreateProctoringEventInput = z.infer<typeof createProctoringEventSchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface ProctoringEventResponse {
    id: string
    eventType: string
    severity: string
    roundType: string | null
    createdAt: Date
}

export interface ProctoringSummaryResponse {
    totalEvents: number
    bySeverity: Record<string, number>
    byType: Record<string, number>
    events: ProctoringEventResponse[]
}
