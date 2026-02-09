import { z } from 'zod'

// ============================================
// CONSTANTS
// ============================================

export const FILE_LIMITS = {
    RESUME: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['application/pdf'],
    },
    VIDEO: {
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedMimeTypes: ['video/mp4', 'video/webm'],
    },
    AI_RECORDING: {
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'video/webm', 'video/mp4'],
    },
}

// ============================================
// REQUEST SCHEMAS
// ============================================

export const requestUploadUrlSchema = z.object({
    fileType: z.enum(['RESUME', 'VIDEO']),
    mimeType: z.string(),
    size: z.number().positive(),
})

export const attachResumeSchema = z.object({
    fileId: z.string(),
})

export const attachVideoSchema = z.object({
    fileId: z.string(),
    questionIndex: z.number().int().min(0).optional(),
})

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>
export type AttachResumeInput = z.infer<typeof attachResumeSchema>
export type AttachVideoInput = z.infer<typeof attachVideoSchema>

// ============================================
// RESPONSE TYPES
// ============================================

export interface UploadUrlResponse {
    fileId: string
    uploadUrl: string
    expiresIn: number
}

export interface FileAssetResponse {
    id: string
    fileType: 'RESUME' | 'VIDEO' | 'AI_RECORDING'
    mimeType: string
    size: number
    createdAt: Date
}
