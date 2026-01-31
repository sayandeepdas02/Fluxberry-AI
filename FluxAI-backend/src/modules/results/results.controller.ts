import { Request, Response, NextFunction } from 'express'
import { resultsService } from './results.service.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class ResultsController {
    /**
     * GET /api/assessments/:assessmentId/results
     * Get all candidates results for an assessment
     */
    async getAssessmentResults(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { assessmentId } = req.params
            const results = await resultsService.getAssessmentResults(assessmentId, organizationId)
            res.json(successResponse(results))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/attempts/:attemptId/result
     * Get detailed result for a single attempt
     */
    async getAttemptResult(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId } = req.params
            const result = await resultsService.getAttemptResult(attemptId)
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }
}

export const resultsController = new ResultsController()
