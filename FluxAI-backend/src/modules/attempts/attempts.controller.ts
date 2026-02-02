import { Request, Response, NextFunction } from 'express'
import { attemptsService } from './attempts.service.js'
import { startAttemptSchema, submitRoundSchema } from './attempts.types.js'
import { successResponse } from '../../common/utils/api-response.js'
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
            res.status(201).json(successResponse(attempt))
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
            res.json(successResponse(attempt))
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
                res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', message: 'Invalid round type' },
                })
                return
            }

            const attempt = await attemptsService.startRound(attemptId, roundType as RoundTypeValue)
            res.json(successResponse(attempt))
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
                res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_INPUT', message: 'Invalid round type' },
                })
                return
            }

            const input = submitRoundSchema.parse(req.body)
            const attempt = await attemptsService.submitRound(attemptId, roundType as RoundTypeValue, input)
            res.json(successResponse(attempt))
        } catch (error) {
            next(error)
        }
    }
}

export const attemptsController = new AttemptsController()
