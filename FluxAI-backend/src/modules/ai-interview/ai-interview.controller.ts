/**
 * AI Interview Controller — V2 (Async Recording + Processing)
 */

import { Request, Response, NextFunction } from 'express'
import { aiInterviewService } from './ai-interview.service.js'
import {
    startAISessionSchema,
    endAISessionSchema,
    initUploadSchema,
    completeUploadSchema,
    completeSessionSchema,
} from './ai-interview.types.js'

class AIInterviewController {
    /**
     * POST /attempts/:attemptId/ai/start
     * Start AI interview session (returns questions)
     */
    async startSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = startAISessionSchema.safeParse(req.body)
            if (!parseResult.success) {
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const result = await aiInterviewService.startSession(attemptId, parseResult.data)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
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
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const result = await aiInterviewService.endSession(attemptId, parseResult.data)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * POST /attempts/:attemptId/ai/upload/init
     * Get pre-signed URL for uploading a question response video
     */
    async initUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = initUploadSchema.safeParse(req.body)
            if (!parseResult.success) {
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const result = await aiInterviewService.initUpload(attemptId, parseResult.data)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * POST /attempts/:attemptId/ai/upload/complete
     * Mark upload as complete and enqueue processing
     */
    async completeUpload(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = completeUploadSchema.safeParse(req.body)
            if (!parseResult.success) {
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const result = await aiInterviewService.completeUpload(attemptId, parseResult.data)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * POST /attempts/:attemptId/ai/complete
     * Finalize the entire AI interview session
     */
    async completeSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const parseResult = completeSessionSchema.safeParse(req.body)
            if (!parseResult.success) {
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const result = await aiInterviewService.completeSession(attemptId, parseResult.data)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * GET /attempts/:attemptId/ai/results
     * Get full AI interview results for recruiter dashboard
     */
    async getResults(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const result = await aiInterviewService.getInterviewResults(attemptId)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * GET /attempts/:attemptId/ai/responses/:questionId/video
     * Get signed download URL for a response video
     */
    async getResponseVideo(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId, questionId } = req.params
            const result = await aiInterviewService.getResponseVideoUrl(attemptId, questionId)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * GET /attempts/:attemptId/ai/details
     * Get AI session details (legacy compat)
     */
    async getSessionDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const result = await aiInterviewService.getSessionDetails(attemptId)
            return res.json({ success: true, data: result })
        } catch (error) { next(error) }
    }
}

export const aiInterviewController = new AIInterviewController()
