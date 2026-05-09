import { Response, NextFunction } from 'express'
import { applicationsService } from './applications.service.js'
import {
    listApplicationsQuerySchema,
    updateStageSchema,
    bulkUpdateSchema,
    createApplicationSchema,
} from './applications.types.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

class ApplicationsController {
    /**
     * POST /api/applications
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const userId = req.user?.id
            if (!organizationId || !userId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const input = createApplicationSchema.parse(req.body)
            const result = await applicationsService.create(organizationId, input, userId)
            res.success(result, 201)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/jobs/:jobId/applications
     */
    async listByJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { jobId } = req.params
            const query = listApplicationsQuerySchema.parse(req.query)
            const result = await applicationsService.list(jobId, organizationId, query)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/applications/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const application = await applicationsService.getById(id, organizationId)
            res.success(application)
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/applications/:id/stage
     */
    async updateStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const userId = req.user?.id
            if (!organizationId || !userId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const input = updateStageSchema.parse(req.body)
            const application = await applicationsService.updateStage(id, organizationId, input, userId)
            res.success(application)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/applications/bulk-update
     */
    async bulkUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const userId = req.user?.id
            if (!organizationId || !userId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const input = bulkUpdateSchema.parse(req.body)
            const result = await applicationsService.bulkUpdate(organizationId, input, userId)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/applications/:id/move-stage (stage-ID-based)
     */
    async moveStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const userId = req.user?.id
            if (!organizationId || !userId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const { stageId } = req.body
            if (!stageId) {
                res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'stageId is required' } })
                return
            }

            const application = await applicationsService.moveToStage(id, organizationId, stageId, userId)
            res.success(application)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/applications/bulk-move (stage-ID-based)
     */
    async bulkMove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const userId = req.user?.id
            if (!organizationId || !userId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { applicationIds, stageId } = req.body
            if (!applicationIds?.length || !stageId) {
                res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'applicationIds and stageId are required' } })
                return
            }

            const result = await applicationsService.bulkMoveToStage(organizationId, applicationIds, stageId, userId)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/applications/:id/stage-history
     */
    async getStageHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const history = await applicationsService.getStageHistory(id, organizationId)
            res.success(history)
        } catch (error) {
            next(error)
        }
    }
}

export const applicationsController = new ApplicationsController()

