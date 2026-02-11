import { Response, NextFunction } from 'express'
import { applicationsService } from './applications.service.js'
import {
    listApplicationsQuerySchema,
    updateStageSchema,
    bulkUpdateSchema,
} from './applications.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

class ApplicationsController {
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
            res.json(successResponse(result))
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
            res.json(successResponse(application))
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
            res.json(successResponse(application))
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
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }
}

export const applicationsController = new ApplicationsController()
