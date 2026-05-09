import { Request, Response, NextFunction } from 'express'
import { proctoringService } from './proctoring.service.js'
import { createProctoringEventSchema } from './proctoring.types.js'

export class ProctoringController {
    /**
     * POST /api/attempts/:attemptId/proctoring-events
     * Log a proctoring event (append-only)
     */
    async logEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId } = req.params
            const input = createProctoringEventSchema.parse(req.body)
            const event = await proctoringService.logEvent(attemptId, input)
            res.success(event, 201)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/attempts/:attemptId/proctoring-summary
     * Get proctoring summary
     */
    async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { attemptId } = req.params
            const summary = await proctoringService.getSummary(attemptId)
            res.success(summary)
        } catch (error) {
            next(error)
        }
    }
}

export const proctoringController = new ProctoringController()
