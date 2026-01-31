import { z } from 'zod'

// ============================================
// REQUEST SCHEMAS
// ============================================

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    organizationName: z.string().min(1, 'Organization name is required'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface AuthTokens {
    accessToken: string
    expiresIn: number
}

export interface AuthOrganization {
    id: string
    name: string
    slug: string
    role: string
}

export interface AuthUser {
    id: string
    email: string
    firstName: string
    lastName: string
    organization: AuthOrganization | null
}

export interface AuthResponse {
    user: AuthUser
    tokens: AuthTokens
}

// ============================================
// JWT PAYLOAD
// ============================================

export interface JwtPayload {
    id: string
    email: string
    organizationId: string | null
    role: string | null
    iat?: number
    exp?: number
}
