import { Response, NextFunction } from 'express'
import { assessmentsService } from './assessments.service.js'
import { createAssessmentSchema, updateAssessmentSchema, roundConfigSchema, inviteCandidatesSchema } from './assessments.types.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class AssessmentsController {
    /**
     * POST /api/assessments
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization context required')
            }

            const input = createAssessmentSchema.parse(req.body)
            const assessment = await assessmentsService.create(organizationId, input)
            res.success(assessment, 201)
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
                throw AppError.forbidden('Organization context required')
            }

            const result = await assessmentsService.list(organizationId)
            res.success(result)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const assessment = await assessmentsService.getById(id, organizationId)
            res.success(assessment)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const input = updateAssessmentSchema.parse(req.body)
            const assessment = await assessmentsService.update(id, organizationId, input)
            res.success(assessment)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const input = roundConfigSchema.parse(req.body)
            const assessment = await assessmentsService.configureRounds(id, organizationId, input)
            res.success(assessment)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const assessment = await assessmentsService.publish(id, organizationId)
            res.success(assessment)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/assessments/:id/invite
     * Add candidate emails and enqueue invite emails (assessment must be ACTIVE).
     */
    async invite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const input = inviteCandidatesSchema.parse(req.body)
            const result = await assessmentsService.inviteCandidates(id, organizationId, input)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }
    /**
     * POST /api/assessments/:id/clone
     * Clone an assessment as a new DRAFT. Optional body: { title?: string }
     */
    async clone(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization context required')
            }
            const { id } = req.params
            const titleOverride: string | undefined = typeof req.body?.title === 'string' ? req.body.title : undefined
            const assessment = await assessmentsService.clone(id, organizationId, titleOverride)
            res.success(assessment, 201)
        } catch (error) {
            next(error)
        }
    }
}

export const assessmentsController = new AssessmentsController()
