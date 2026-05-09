/**
 * AI Interview Controller — V2 (Async Recording + Processing) + Orchestrator
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { aiInterviewService } from './ai-interview.service.js'
import { interviewOrchestrator } from './services/interviewOrchestrator.js'
import {
    startAISessionSchema,
    endAISessionSchema,
    initUploadSchema,
    completeUploadSchema,
    completeSessionSchema,
} from './ai-interview.types.js'

// ─── Orchestrator request schemas ─────────────────────────────────────────────

const createOrchestratorSessionSchema = z.object({
    attemptId: z.string().min(1),
    candidateContext: z.object({
        role: z.string().optional(),
        yearsOfExperience: z.number().min(0).max(50).optional(),
        projects: z.array(z.string()).optional(),
        techStack: z.array(z.string()).optional(),
    }).optional().default({}),
    aiConfig: z.object({
        role: z.enum(['FRONTEND', 'BACKEND', 'FULLSTACK', 'DEVOPS']).optional(),
        difficulty: z.enum(['JUNIOR', 'MID', 'SENIOR']).optional(),
        maxDurationMinutes: z.number().int().min(15).max(90).optional(),
        maxFundamentalQuestions: z.number().int().min(2).max(10).optional(),
        maxProjectFollowUps: z.number().int().min(1).max(5).optional(),
        grillingIntensity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    }).optional(),
})

const submitTurnSchema = z.object({
    answer: z.string().min(1, 'Answer cannot be empty').max(10000),
})

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
            return res.success(result )
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
            return res.success(result )
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
            return res.success(result )
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
            return res.success(result )
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
            return res.success(result )
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
            return res.success(result )
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
            return res.success(result )
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
            return res.success(result )
        } catch (error) { next(error) }
    }

    /**
     * POST /attempts/:attemptId/ai/ribbon/start
     * Start Ribbon interactive voice interview. Sets cookie for callback and returns interview_link.
     */
    async startRibbonSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { attemptId } = req.params
            const result = await aiInterviewService.startRibbonSession(attemptId)
            res.cookie('fluxai_ribbon_attempt', attemptId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 1000, // 1 hour
            })
            return res.success(result )
        } catch (error) { next(error) }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR HANDLERS — LLM state machine interview
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/ai-interview/orchestrator/sessions
     * Create a new AI orchestrator interview session.
     * Body: { attemptId, candidateContext?, aiConfig? }
     */
    async createOrchestratorSession(req: Request, res: Response, next: NextFunction) {
        try {
            const parseResult = createOrchestratorSessionSchema.safeParse(req.body)
            if (!parseResult.success) {
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const { attemptId, candidateContext, aiConfig } = parseResult.data
            const result = await interviewOrchestrator.createSession(
                attemptId,
                candidateContext ?? {},
                aiConfig,
            )
            return res.status(201).json({ success: true, data: result })
        } catch (error) { next(error) }
    }

    /**
     * POST /api/ai-interview/orchestrator/sessions/:sessionId/turn
     * Submit a candidate answer and receive the next AI question.
     * Body: { answer: string }
     */
    async submitOrchestratorTurn(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params
            const parseResult = submitTurnSchema.safeParse(req.body)
            if (!parseResult.success) {
                return res.status(400).json({ success: false, error: 'Invalid request body', details: parseResult.error.errors })
            }
            const result = await interviewOrchestrator.submitTurn(sessionId, parseResult.data.answer)
            return res.success(result )
        } catch (error) { next(error) }
    }

    /**
     * GET /api/ai-interview/orchestrator/sessions/:sessionId
     * Get current session state (for reconnection / frontend polling).
     */
    async getOrchestratorSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params
            const result = await interviewOrchestrator.getSessionState(sessionId)
            return res.success(result )
        } catch (error) { next(error) }
    }

    /**
     * POST /api/ai-interview/orchestrator/sessions/:sessionId/complete
     * Manually trigger session completion (e.g., candidate disconnects or time runs out).
     */
    async completeOrchestratorSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params
            const result = await interviewOrchestrator.completeSession(sessionId)
            return res.success(result )
        } catch (error) { next(error) }
    }
}

export const aiInterviewController = new AIInterviewController()
