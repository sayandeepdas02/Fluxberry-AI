import { Request, Response, NextFunction } from 'express'
import { crmService } from './crm.service.js'

class CRMController {
    // ── Talent Pools ─────────────────────────────────────────

    async listPools(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = req.query.ownerId as string | undefined
            const pools = await crmService.listTalentPools(orgId, userId)
            res.json({ success: true, data: pools })
        } catch (err) { next(err) }
    }

    async createPool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const pool = await crmService.createTalentPool(orgId, req.body, userId)
            res.status(201).json({ success: true, data: pool })
        } catch (err) { next(err) }
    }

    async getPool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const pool = await crmService.getTalentPoolById(req.params.poolId, orgId)
            if (!pool) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pool not found' } })
            res.json({ success: true, data: pool })
        } catch (err) { next(err) }
    }

    async updatePool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const pool = await crmService.updateTalentPool(req.params.poolId, orgId, req.body)
            res.json({ success: true, data: pool })
        } catch (err) { next(err) }
    }

    async deletePool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            await crmService.deleteTalentPool(req.params.poolId, orgId)
            res.json({ success: true, data: { deleted: true } })
        } catch (err) { next(err) }
    }

    async addToPool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const pool = await crmService.addToPool(req.params.poolId, orgId, req.body.candidateIds)
            res.json({ success: true, data: pool })
        } catch (err) { next(err) }
    }

    async removeFromPool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const pool = await crmService.removeFromPool(req.params.poolId, orgId, req.body.candidateIds)
            res.json({ success: true, data: pool })
        } catch (err) { next(err) }
    }

    async refreshSmartPool(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const pool = await crmService.refreshSmartPool(req.params.poolId, orgId)
            if (!pool) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Smart pool not found' } })
            res.json({ success: true, data: pool })
        } catch (err) { next(err) }
    }

    // ── Saved Searches ───────────────────────────────────────

    async listSearches(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const searches = await crmService.listSavedSearches(orgId, userId)
            res.json({ success: true, data: searches })
        } catch (err) { next(err) }
    }

    async createSearch(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const search = await crmService.createSavedSearch(orgId, req.body, userId)
            res.status(201).json({ success: true, data: search })
        } catch (err) { next(err) }
    }

    async executeSearch(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await crmService.executeSavedSearch(req.params.searchId, orgId, {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            })
            if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Search not found' } })
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async deleteSearch(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            await crmService.deleteSavedSearch(req.params.searchId, orgId)
            res.json({ success: true, data: { deleted: true } })
        } catch (err) { next(err) }
    }

    // ── Segmentation ─────────────────────────────────────────

    async segmentCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await crmService.segmentCandidates(orgId, req.query as any)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Bookmarks ────────────────────────────────────────────

    async listBookmarks(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const bookmarks = await crmService.listBookmarks(orgId, userId)
            res.json({ success: true, data: bookmarks })
        } catch (err) { next(err) }
    }

    async createBookmark(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const bookmark = await crmService.createBookmark(orgId, req.body.candidateId, userId, req.body.notes)
            res.status(201).json({ success: true, data: bookmark })
        } catch (err) { next(err) }
    }

    async removeBookmark(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            await crmService.removeBookmark(orgId, req.params.candidateId, userId)
            res.json({ success: true, data: { deleted: true } })
        } catch (err) { next(err) }
    }

    // ── Reminders ────────────────────────────────────────────

    async listReminders(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const status = req.query.status as string | undefined
            const reminders = await crmService.listReminders(orgId, userId, status)
            res.json({ success: true, data: reminders })
        } catch (err) { next(err) }
    }

    async createReminder(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const reminder = await crmService.createReminder(orgId, { ...req.body, userId })
            res.status(201).json({ success: true, data: reminder })
        } catch (err) { next(err) }
    }

    async completeReminder(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const reminder = await crmService.completeReminder(req.params.reminderId, orgId)
            res.json({ success: true, data: reminder })
        } catch (err) { next(err) }
    }

    async dismissReminder(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const reminder = await crmService.dismissReminder(req.params.reminderId, orgId)
            res.json({ success: true, data: reminder })
        } catch (err) { next(err) }
    }

    // ── Relationships ────────────────────────────────────────

    async logRelationship(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const log = await crmService.logRelationship(orgId, { ...req.body, userId })
            res.status(201).json({ success: true, data: log })
        } catch (err) { next(err) }
    }

    async getRelationshipTimeline(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await crmService.getRelationshipTimeline(orgId, req.params.candidateId, {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 50,
            })
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Tags ─────────────────────────────────────────────────

    async addTags(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const candidate = await crmService.addCandidateTags(orgId, req.params.candidateId, req.body.tags)
            res.json({ success: true, data: candidate })
        } catch (err) { next(err) }
    }

    async removeTags(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const candidate = await crmService.removeCandidateTags(orgId, req.params.candidateId, req.body.tags)
            res.json({ success: true, data: candidate })
        } catch (err) { next(err) }
    }
}

export const crmController = new CRMController()
