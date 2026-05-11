import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/types/request.types.js'
import { AppError } from '../../common/errors/index.js'
import { talentCRMService } from './talent-crm.service.js'

export class TalentCRMController {

    // ─── Pools ────────────────────────────────────────────────

    async listPools(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { page, limit, search } = req.query as any
            const result = await talentCRMService.listPools(orgId, {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                search,
            })
            res.success(result)
        } catch (e) { next(e) }
    }

    async createPool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const pool = await talentCRMService.createPool(orgId, userId, req.body)
            res.success(pool, 201)
        } catch (e) { next(e) }
    }

    async getPool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const pool = await talentCRMService.getPool(req.params.id, orgId)
            res.success(pool)
        } catch (e) { next(e) }
    }

    async updatePool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const pool = await talentCRMService.updatePool(req.params.id, orgId, req.body)
            res.success(pool)
        } catch (e) { next(e) }
    }

    async deletePool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            await talentCRMService.deletePool(req.params.id, orgId)
            res.success({ deleted: true })
        } catch (e) { next(e) }
    }

    async addCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { candidateIds } = req.body
            if (!Array.isArray(candidateIds) || candidateIds.length === 0)
                throw AppError.badRequest('candidateIds array required')
            const pool = await talentCRMService.addCandidatesToPool(req.params.id, orgId, candidateIds)
            res.success(pool)
        } catch (e) { next(e) }
    }

    async removeCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { candidateIds } = req.body
            if (!Array.isArray(candidateIds) || candidateIds.length === 0)
                throw AppError.badRequest('candidateIds array required')
            const pool = await talentCRMService.removeCandidatesFromPool(req.params.id, orgId, candidateIds)
            res.success(pool)
        } catch (e) { next(e) }
    }

    async getPoolCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { page, limit } = req.query as any
            const result = await talentCRMService.getPoolCandidates(
                req.params.id, orgId,
                page ? parseInt(page) : 1,
                limit ? parseInt(limit) : 30
            )
            res.success(result)
        } catch (e) { next(e) }
    }

    // ─── Saved Searches ───────────────────────────────────────

    async listSavedSearches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const searches = await talentCRMService.listSavedSearches(orgId)
            res.success(searches)
        } catch (e) { next(e) }
    }

    async createSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const search = await talentCRMService.createSavedSearch(orgId, userId, req.body)
            res.success(search, 201)
        } catch (e) { next(e) }
    }

    async deleteSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            await talentCRMService.deleteSavedSearch(req.params.id, orgId)
            res.success({ deleted: true })
        } catch (e) { next(e) }
    }

    async runSavedSearch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { page, limit } = req.query as any
            const result = await talentCRMService.runSavedSearch(req.params.id, orgId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20)
            res.success(result)
        } catch (e) { next(e) }
    }

    // ─── Reminders ────────────────────────────────────────────

    async listReminders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const filter = (req.query.filter as any) || undefined
            const reminders = await talentCRMService.listReminders(orgId, userId, filter)
            res.success(reminders)
        } catch (e) { next(e) }
    }

    async createReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const reminder = await talentCRMService.createReminder(orgId, userId, req.body)
            res.success(reminder, 201)
        } catch (e) { next(e) }
    }

    async completeReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const reminder = await talentCRMService.completeReminder(req.params.id, orgId, userId)
            res.success(reminder)
        } catch (e) { next(e) }
    }

    async deleteReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            await talentCRMService.deleteReminder(req.params.id, orgId, userId)
            res.success({ deleted: true })
        } catch (e) { next(e) }
    }

    // ─── Bookmarks ────────────────────────────────────────────

    async listBookmarks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const bookmarks = await talentCRMService.listBookmarks(orgId, userId)
            res.success(bookmarks)
        } catch (e) { next(e) }
    }

    async bookmarkCandidate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            const { candidateId } = req.params
            const { note } = req.body
            const bookmark = await talentCRMService.bookmarkCandidate(orgId, userId, candidateId, note)
            res.success(bookmark, 201)
        } catch (e) { next(e) }
    }

    async removeBookmark(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            const userId = req.user?.id
            if (!orgId || !userId) throw AppError.forbidden('Organization context required')
            await talentCRMService.removeBookmark(orgId, userId, req.params.candidateId)
            res.success({ deleted: true })
        } catch (e) { next(e) }
    }
}

export const talentCRMController = new TalentCRMController()
