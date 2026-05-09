import { Response, NextFunction } from 'express'
import { jobsService } from './jobs.service.js'
import { createJobSchema, updateJobSchema, listJobsQuerySchema, parseDescriptionSchema } from './jobs.types.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'
import { jobParserService } from './job-parser.service.js'
import { skillSuggestionsService } from './skill-suggestions.service.js'

export class JobsController {
    /**
     * POST /api/jobs
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization context required')
            }

            const input = createJobSchema.parse(req.body)
            const job = await jobsService.create(organizationId, input, req.user?.id)
            res.success(job, 201)
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
                throw AppError.forbidden('Organization context required')
            }

            const query = listJobsQuerySchema.parse(req.query)
            const result = await jobsService.list(organizationId, query)
            res.success(result)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const job = await jobsService.getById(id, organizationId)
            const applicationCount = await jobsService.getApplicationCount(id)
            res.success({ ...job.toJSON(), applicationCount })
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const input = updateJobSchema.parse(req.body)
            const job = await jobsService.update(id, organizationId, input, req.user?.id)
            res.success(job)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const job = await jobsService.publish(id, organizationId, req.user!.id)
            res.success(job)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const job = await jobsService.close(id, organizationId, req.user!.id)
            res.success(job)
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
                throw AppError.forbidden('Organization context required')
            }

            const { id } = req.params
            const job = await jobsService.softDelete(id, organizationId, req.user!.id)
            res.success(job)
        } catch (error) {
            next(error)
        }
    }
    /**
     * POST /api/jobs/parse-description
     * AI-powered JD parser — extracts structured fields from free text.
     * Returns a best-effort result; frontend always allows manual override.
     */
    async parseDescription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { description } = parseDescriptionSchema.parse(req.body)
            const result = await jobParserService.parseJobDescription(description)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/jobs/skill-suggestions?q=react&role=Frontend
     * Returns skill name suggestions for autocomplete.
     */
    async skillSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const q    = typeof req.query.q    === 'string' ? req.query.q    : ''
            const role = typeof req.query.role === 'string' ? req.query.role : undefined
            const suggestions = skillSuggestionsService.suggestSkills(q, role)
            res.success(suggestions)
        } catch (error) {
            next(error)
        }
    }
}

export const jobsController = new JobsController()
