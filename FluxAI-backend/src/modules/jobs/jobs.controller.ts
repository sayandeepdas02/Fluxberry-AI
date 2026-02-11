import { Response, NextFunction } from 'express'
import { jobsService } from './jobs.service.js'
import { createJobSchema, updateJobSchema, listJobsQuerySchema } from './jobs.types.js'
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
            const job = await jobsService.create(organizationId, input, req.user?.id)
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

            const query = listJobsQuerySchema.parse(req.query)
            const result = await jobsService.list(organizationId, query)
            res.json(successResponse(result))
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
            const applicationCount = await jobsService.getApplicationCount(id)
            res.json(successResponse({ ...job.toJSON(), applicationCount }))
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
            const job = await jobsService.update(id, organizationId, input, req.user?.id)
            res.json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/jobs/:id/publish
     * Requires ADMIN or OWNER role
     */
    async publish(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const job = await jobsService.publish(id, organizationId, req.user!.id)
            res.json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/jobs/:id/close
     * Requires ADMIN or OWNER role
     */
    async close(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const job = await jobsService.close(id, organizationId, req.user!.id)
            res.json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }

    /**
     * DELETE /api/jobs/:id (soft delete)
     * Requires ADMIN or OWNER role
     */
    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const job = await jobsService.softDelete(id, organizationId, req.user!.id)
            res.json(successResponse(job))
        } catch (error) {
            next(error)
        }
    }
}

export const jobsController = new JobsController()
