import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')

export const slugSchema = z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')

export const cuidSchema = z.string().cuid('Invalid ID format')

// Validation helper
export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
}
