import { Response, NextFunction } from 'express'
import { candidatesService } from './candidates.service.js'
import { createCandidateSchema, updateCandidateSchema, listCandidatesQuerySchema } from './candidates.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class CandidatesController {
    /**
     * POST /api/candidates
     */
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const input = createCandidateSchema.parse(req.body)
            const candidate = await candidatesService.create(organizationId, input)
            res.status(201).json(successResponse(candidate))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candidates
     */
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const query = listCandidatesQuerySchema.parse(req.query)
            const result = await candidatesService.list(organizationId, query)
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candidates/:id
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const candidate = await candidatesService.getById(id, organizationId)
            const history = await candidatesService.getHistory(id, organizationId)

            res.json(successResponse({ candidate, history }))
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/candidates/:id
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const input = updateCandidateSchema.parse(req.body)
            const candidate = await candidatesService.update(id, organizationId, input)
            res.json(successResponse(candidate))
        } catch (error) {
            next(error)
        }
    }
}

export const candidatesController = new CandidatesController()
