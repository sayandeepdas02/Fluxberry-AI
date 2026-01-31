import prisma from '../../database/prisma.js'
import { OwnerType, FileType } from '@prisma/client'
import {
    generateUploadUrl,
    generateStorageKey,
} from '../storage/s3.client.js'
import {
    RequestUploadUrlInput,
    FILE_LIMITS,
    UploadUrlResponse,
    FileAssetResponse,
} from './files.types.js'

export class FilesService {
    /**
     * Request a pre-signed upload URL
     * Validates file constraints and creates metadata record
     */
    async requestUploadUrl(
        ownerType: OwnerType,
        ownerId: string,
        input: RequestUploadUrlInput,
        organizationId?: string
    ): Promise<UploadUrlResponse> {
        const { fileType, mimeType, size } = input
        const limits = FILE_LIMITS[fileType]

        // Validate size
        if (size > limits.maxSize) {
            const error = new Error(`File size exceeds ${limits.maxSize / (1024 * 1024)}MB limit`) as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'FILE_TOO_LARGE'
            throw error
        }

        // Validate MIME type
        if (!limits.allowedMimeTypes.includes(mimeType)) {
            const error = new Error(`Invalid file type. Allowed: ${limits.allowedMimeTypes.join(', ')}`) as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_MIME_TYPE'
            throw error
        }

        // Generate storage key
        const extension = mimeType.split('/')[1] || 'bin'
        const storageKey = generateStorageKey(ownerType, ownerId, fileType, extension)

        // Create file asset record (pending upload)
        const fileAsset = await prisma.fileAsset.create({
            data: {
                organizationId,
                ownerType,
                ownerId,
                fileType: fileType as FileType,
                storageKey,
                mimeType,
                size,
            },
        })

        // Generate pre-signed URL
        const { uploadUrl } = await generateUploadUrl(storageKey, mimeType, size)

        return {
            fileId: fileAsset.id,
            uploadUrl,
            expiresIn: 15 * 60, // 15 minutes
        }
    }

    /**
     * Attach resume to an attempt
     * Only one resume per attempt allowed
     */
    async attachResume(attemptId: string, fileId: string, candidateId: string): Promise<FileAssetResponse> {
        // Verify attempt exists and belongs to candidate
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
        })

        if (!attempt || attempt.candidateId !== candidateId) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Verify file exists and is a resume owned by this candidate
        const file = await prisma.fileAsset.findUnique({
            where: { id: fileId },
        })

        if (!file || file.ownerType !== 'CANDIDATE' || file.ownerId !== candidateId || file.fileType !== 'RESUME') {
            const error = new Error('Invalid file') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_FILE'
            throw error
        }

        // Check if resume already attached (one per attempt)
        const existingResume = await prisma.fileAsset.findFirst({
            where: {
                ownerType: 'CANDIDATE',
                ownerId: candidateId,
                fileType: 'RESUME',
                id: { not: fileId },
            },
        })

        if (existingResume) {
            const error = new Error('Resume already attached to this attempt') as Error & { statusCode: number; code: string }
            error.statusCode = 409
            error.code = 'ALREADY_EXISTS'
            throw error
        }

        return this.formatFileAsset(file)
    }

    /**
     * Attach video to a round
     * Multiple videos allowed per AI round
     */
    async attachVideo(
        attemptId: string,
        roundType: string,
        fileId: string,
        candidateId: string,
        _questionIndex?: number
    ): Promise<FileAssetResponse> {
        // Verify attempt and round
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: { rounds: true },
        })

        if (!attempt || attempt.candidateId !== candidateId) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const round = attempt.rounds.find((r) => r.roundType === roundType)
        if (!round) {
            const error = new Error('Round not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Verify file exists and is a video owned by this candidate
        const file = await prisma.fileAsset.findUnique({
            where: { id: fileId },
        })

        if (!file || file.ownerType !== 'CANDIDATE' || file.ownerId !== candidateId || file.fileType !== 'VIDEO') {
            const error = new Error('Invalid file') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_FILE'
            throw error
        }

        return this.formatFileAsset(file)
    }

    /**
     * Get file by ID
     */
    async getById(fileId: string): Promise<FileAssetResponse | null> {
        const file = await prisma.fileAsset.findUnique({
            where: { id: fileId },
        })

        return file ? this.formatFileAsset(file) : null
    }

    /**
     * Format file asset for response
     */
    private formatFileAsset(file: {
        id: string
        fileType: FileType
        mimeType: string
        size: number
        createdAt: Date
    }): FileAssetResponse {
        return {
            id: file.id,
            fileType: file.fileType,
            mimeType: file.mimeType,
            size: file.size,
            createdAt: file.createdAt,
        }
    }
}

export const filesService = new FilesService()
