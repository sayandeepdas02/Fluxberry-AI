import { Response, NextFunction } from 'express'
import { jobsService } from './jobs.service.js'
import { createJobSchema, updateJobSchema } from './jobs.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class JobsController {
    /**
     * POST /api/jobs
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const input = createJobSchema.parse(req.body)
            const job = await jobsService.create(organizationId, input)
            res.status(201).json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/jobs
     */
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const jobs = await jobsService.list(organizationId)
            res.json(successResponse(jobs))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/jobs/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const job = await jobsService.getById(id, organizationId)
            res.json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/jobs/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const input = updateJobSchema.parse(req.body)
            const job = await jobsService.update(id, organizationId, input)
            res.json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }
}

export const jobsController = new JobsController()
