/**
 * AI Interview Controller
 */

import { Request, Response, NextFunction } from 'express'
import { aiInterviewService } from './ai-interview.service.js'
import {
    startAISessionSchema,
    endAISessionSchema,
    saveTranscriptSchema,
} from './ai-interview.types.js'
import { FileAsset, FileType } from '../../database/models/index.js'

class AIInterviewController {
    /**
     * POST /attempts/:attemptId/ai/start
     * Start AI interview session
     */
    async startSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = startAISessionSchema.safeParse(req.body)

            if (!parseResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    details: parseResult.error.errors,
                })
            }

            const result = await aiInterviewService.startSession(attemptId, parseResult.data)

            return res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /attempts/:attemptId/ai/end
     * End AI interview session
     */
    async endSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = endAISessionSchema.safeParse(req.body)

            if (!parseResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    details: parseResult.error.errors,
                })
            }

            const result = await aiInterviewService.endSession(attemptId, parseResult.data)

            return res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /attempts/:attemptId/ai/transcript
     * Save transcript entries
     */
    async saveTranscript(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = saveTranscriptSchema.safeParse(req.body)

            if (!parseResult.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request body',
                    details: parseResult.error.errors,
                })
            }

            const result = await aiInterviewService.saveTranscript(attemptId, parseResult.data)

            return res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /attempts/:attemptId/ai/media
     * Upload media asset (audio/video recording)
     */
    async uploadMedia(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const { sessionId, mediaType } = req.body

            if (!sessionId || !mediaType) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing sessionId or mediaType',
                })
            }

            if (!['AUDIO', 'VIDEO'].includes(mediaType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid mediaType, must be AUDIO or VIDEO',
                })
            }

            // V1: Handle file upload via multer (assumed to be configured in routes)
            const file = req.file
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                })
            }

            // Create file asset record
            const storageKey = `ai-recordings/${sessionId}/${mediaType.toLowerCase()}-${Date.now()}`
            const fileAsset = await FileAsset.create({
                ownerType: 'CANDIDATE',
                ownerId: attemptId,
                fileType: FileType.AI_RECORDING,
                storageKey,
                mimeType: file.mimetype,
                size: file.size,
            })

            // Link to session
            await aiInterviewService.saveMediaAsset(
                attemptId,
                sessionId,
                mediaType as 'AUDIO' | 'VIDEO',
                fileAsset._id.toString()
            )

            return res.json({
                success: true,
                data: {
                    assetId: fileAsset._id.toString(),
                    mediaType,
                    duration: null, // V2: Extract from file
                    size: file.size,
                },
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /attempts/:attemptId/ai/details
     * Get AI interview session details (for recruiter dashboard)
     */
    async getSessionDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const result = await aiInterviewService.getSessionDetails(attemptId)

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'AI session not found',
                })
            }

            return res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            next(error)
        }
    }
}

export const aiInterviewController = new AIInterviewController()
