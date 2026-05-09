import { Request, Response, NextFunction } from 'express'
import { attemptsService } from './attempts.service.js'
import { startAttemptSchema, submitRoundSchema, submitAnswerSchema } from './attempts.types.js'
import { AppError } from '../../common/errors/index.js'
import { RoundTypeValue } from '../../database/models/index.js'

export class AttemptsController {
    /**
     * POST /api/assessments/:assessmentId/attempts
     * Start or resume an attempt
     */
    async startOrResume(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { assessmentId } = req.params
            const input = startAttemptSchema.parse(req.body)
            const attempt = await attemptsService.startOrResume(assessmentId, input)
            res.success(attempt, 201)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/attempts/:attemptId
     */
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId } = req.params
            const attempt = await attemptsService.getById(attemptId)
            res.success(attempt)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/attempts/:attemptId/rounds/:roundType/start
     */
    async startRound(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundType } = req.params

            if (!['MCQ', 'DSA', 'AI'].includes(roundType)) {
                throw AppError.badRequest('Invalid round type')
            }

            const attempt = await attemptsService.startRound(attemptId, roundType as RoundTypeValue)
            res.success(attempt)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/attempts/:attemptId/rounds/:roundType/submit
     */
    async submitRound(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundType } = req.params

            if (!['MCQ', 'DSA', 'AI'].includes(roundType)) {
                throw AppError.badRequest('Invalid round type')
            }

            const input = submitRoundSchema.parse(req.body)
            const attempt = await attemptsService.submitRound(attemptId, roundType as RoundTypeValue, input)
            res.success(attempt)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/attempts/:attemptId/rounds/:roundType/questions
     * Candidate-facing: returns questions for the round (MCQ without correct answers)
     */
    async getRoundQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundType } = req.params

            if (!['MCQ', 'DSA', 'AI'].includes(roundType)) {
                throw AppError.badRequest('Invalid round type')
            }

            const questions = await attemptsService.getRoundQuestions(attemptId, roundType as RoundTypeValue)
            res.success(questions)
        } catch (error) {
            next(error)
        }
    }

    // ============================================
    // Per-Question APIs (V1)
    // ============================================

    /**
     * GET /api/attempts/:attemptId/rounds/:roundIndex/current-question
     * Get current question for resume scenarios
     */
    async getCurrentQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundIndex } = req.params
            const roundIdx = parseInt(roundIndex, 10)

            if (isNaN(roundIdx) || roundIdx < 0) {
                throw AppError.badRequest('Invalid round index')
            }

            const result = await attemptsService.getCurrentQuestion(attemptId, roundIdx)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/attempts/:attemptId/rounds/:roundIndex/questions/:questionIndex/start
     * Start the timer for a specific question
     */
    async startQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundIndex, questionIndex } = req.params
            const roundIdx = parseInt(roundIndex, 10)
            const questionIdx = parseInt(questionIndex, 10)

            if (isNaN(roundIdx) || roundIdx < 0 || isNaN(questionIdx) || questionIdx < 0) {
                throw AppError.badRequest('Invalid round or question index')
            }

            const result = await attemptsService.startQuestion(attemptId, roundIdx, questionIdx)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/attempts/:attemptId/rounds/:roundIndex/questions/:questionIndex/submit
     * Submit answer for a specific question
     */
    async submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId, roundIndex, questionIndex } = req.params
            const roundIdx = parseInt(roundIndex, 10)
            const questionIdx = parseInt(questionIndex, 10)

            if (isNaN(roundIdx) || roundIdx < 0 || isNaN(questionIdx) || questionIdx < 0) {
                throw AppError.badRequest('Invalid round or question index')
            }

            const input = submitAnswerSchema.parse(req.body)
            const result = await attemptsService.submitAnswer(attemptId, roundIdx, questionIdx, input)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/attempts/ribbon-callback
     * Called by frontend callback page with cookie. Returns nextUrl to redirect the candidate.
     */
    async ribbonCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const attemptId = (req as Request & { cookies?: Record<string, string> }).cookies?.fluxai_ribbon_attempt
            if (!attemptId) {
                throw AppError.badRequest('Ribbon callback cookie missing')
            }
            const result = await attemptsService.getRibbonCallbackNextUrl(attemptId)
            res.clearCookie('fluxai_ribbon_attempt', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            })
            res.success(result)
        } catch (error) {
            next(error)
        }
    }
}

export const attemptsController = new AttemptsController()

