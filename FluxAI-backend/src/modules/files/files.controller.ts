import { Request, Response, NextFunction } from 'express'
import { filesService } from './files.service.js'
import { requestUploadUrlSchema, attachResumeSchema, attachVideoSchema } from './files.types.js'
import { AppError } from '../../common/errors/index.js'

export class FilesController {
    /**
     * POST /api/files/upload-url
     * Request a pre-signed upload URL
     */
    async requestUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = requestUploadUrlSchema.parse(req.body)

            // For now, extract candidate info from body (in production, from auth token)
            const { candidateId, organizationId } = req.body as { candidateId?: string; organizationId?: string }

            if (!candidateId) {
                throw AppError.badRequest('candidateId is required')
            }

            const result = await filesService.requestUploadUrl(
                'CANDIDATE',
                candidateId,
                input,
                organizationId
            )

            res.success(result, 201)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/attempts/:attemptId/resume
     * Attach resume to attempt
     */
    async attachResume(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId } = req.params
            const input = attachResumeSchema.parse(req.body)
            const { candidateId } = req.body as { candidateId?: string }

            if (!candidateId) {
                throw AppError.badRequest('candidateId is required')
            }

            const result = await filesService.attachResume(attemptId, input.fileId, candidateId)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/attempts/:attemptId/rounds/:roundType/video
     * Attach video to round
     */
    async attachVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundType } = req.params
            const input = attachVideoSchema.parse(req.body)
            const { candidateId } = req.body as { candidateId?: string }

            if (!candidateId) {
                throw AppError.badRequest('candidateId is required')
            }

            const result = await filesService.attachVideo(
                attemptId,
                roundType,
                input.fileId,
                candidateId,
                input.questionIndex
            )
            res.success(result)
        } catch (error) {
            next(error)
        }
    }
}

export const filesController = new FilesController()
