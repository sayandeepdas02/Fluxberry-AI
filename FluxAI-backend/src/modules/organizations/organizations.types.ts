import { z } from 'zod'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const updateOrganizationSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).max(50).optional(),
    logoUrl: z.string().url().optional().nullable(),
    website: z.string().url().optional().nullable(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface OrganizationResponse {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    website: string | null
    plan: string
    memberCount: number
    role?: string
    createdAt: Date
}

export interface OrganizationMemberResponse {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    joinedAt: Date
}
