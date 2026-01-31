import { Response, NextFunction } from 'express'
import { assessmentsService } from './assessments.service.js'
import { createAssessmentSchema, updateAssessmentSchema, roundConfigSchema } from './assessments.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class AssessmentsController {
    /**
     * POST /api/assessments
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const input = createAssessmentSchema.parse(req.body)
            const assessment = await assessmentsService.create(organizationId, input)
            res.status(201).json(successResponse(assessment))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/assessments
     */
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const result = await assessmentsService.list(organizationId)
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/assessments/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const assessment = await assessmentsService.getById(id, organizationId)
            res.json(successResponse(assessment))
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/assessments/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const input = updateAssessmentSchema.parse(req.body)
            const assessment = await assessmentsService.update(id, organizationId, input)
            res.json(successResponse(assessment))
        } catch (error) {
            next(error)
        }
    }

    /**
     * PUT /api/assessments/:id/rounds
     */
    async configureRounds(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const input = roundConfigSchema.parse(req.body)
            const assessment = await assessmentsService.configureRounds(id, organizationId, input)
            res.json(successResponse(assessment))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/assessments/:id/publish
     */
    async publish(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const assessment = await assessmentsService.publish(id, organizationId)
            res.json(successResponse(assessment))
        } catch (error) {
            next(error)
        }
    }
}

export const assessmentsController = new AssessmentsController()
