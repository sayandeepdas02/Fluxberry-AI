import { Response, NextFunction } from 'express'
import { candidatesService } from './candidates.service.js'
import { createCandidateSchema, updateCandidateSchema, listCandidatesQuerySchema, createNoteSchema } from './candidates.types.js'
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
            const candidate = await candidatesService.create(organizationId, input, req.user!.id)
            res.success(candidate, 201)
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
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/candidates/:id
     * Returns full detail: candidate + applications + stageHistory + notes
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const detail = await candidatesService.getDetail(id, organizationId)
            res.success(detail)
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
            const candidate = await candidatesService.update(id, organizationId, input, req.user!.id)
            res.success(candidate)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/candidates/:id/notes
     */
    async addNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const userId = req.user?.id
            if (!organizationId || !userId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const input = createNoteSchema.parse(req.body)
            const note = await candidatesService.addNote(id, organizationId, userId, input)
            res.success(note, 201)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/candidates/:id/resume
     */
    async attachResume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { id } = req.params
            const { fileId } = req.body
            if (!fileId) {
                res.status(400).json({ success: false, error: { code: 'MISSING_FILE_ID', message: 'fileId is required' } })
                return
            }

            const candidate = await candidatesService.attachResume(id, organizationId, fileId)
            res.success(candidate)
        } catch (error) {
            next(error)
        }
    }
}

export const candidatesController = new CandidatesController()
