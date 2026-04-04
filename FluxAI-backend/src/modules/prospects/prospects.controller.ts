import { Request, Response, NextFunction } from 'express'
import { prospectService } from './prospects.service.js'

class ProspectsController {
    // ── Prospects ────────────────────────────────────────
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.list(req.user!.organizationId, req.query as any)
            res.success(result)
        } catch (err) { next(err) }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const prospect = await prospectService.getById(req.params.id, req.user!.organizationId)
            if (!prospect) return res.error('NOT_FOUND', 'Prospect not found', null, 404)
            res.success(prospect)
        } catch (err) { next(err) }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const prospect = await prospectService.create(req.user!.organizationId, req.body, req.user!.id)
            res.success(prospect, 201)
        } catch (err) { next(err) }
    }

    async createBulk(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.createBulk(req.user!.organizationId, req.body.prospects, req.user!.id)
            res.success(result, 201)
        } catch (err) { next(err) }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const prospect = await prospectService.update(req.params.id, req.user!.organizationId, req.body)
            if (!prospect) return res.error('NOT_FOUND', 'Prospect not found', null, 404)
            res.success(prospect)
        } catch (err) { next(err) }
    }

    async convertToCandidate(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.convertToCandidate(req.params.id, req.user!.organizationId, req.user!.id)
            res.success(result)
        } catch (err) { next(err) }
    }

    // ── Lists ────────────────────────────────────────────
    async listLists(req: Request, res: Response, next: NextFunction) {
        try {
            const lists = await prospectService.listLists(req.user!.organizationId)
            res.success(lists)
        } catch (err) { next(err) }
    }

    async createList(req: Request, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.createList(req.user!.organizationId, req.body, req.user!.id)
            res.success(list, 201)
        } catch (err) { next(err) }
    }

    async getListById(req: Request, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.getListById(req.params.id, req.user!.organizationId)
            if (!list) return res.error('NOT_FOUND', 'List not found', null, 404)
            res.success(list)
        } catch (err) { next(err) }
    }

    async addToList(req: Request, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.addToList(req.params.id, req.user!.organizationId, req.body.prospectIds)
            res.success(list)
        } catch (err) { next(err) }
    }

    async removeFromList(req: Request, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.removeFromList(req.params.id, req.user!.organizationId, req.body.prospectIds)
            res.success(list)
        } catch (err) { next(err) }
    }

    // ── Campaigns ────────────────────────────────────────
    async listCampaigns(req: Request, res: Response, next: NextFunction) {
        try {
            const campaigns = await prospectService.listCampaigns(req.user!.organizationId)
            res.success(campaigns)
        } catch (err) { next(err) }
    }

    async createCampaign(req: Request, res: Response, next: NextFunction) {
        try {
            const campaign = await prospectService.createCampaign(req.user!.organizationId, req.body, req.user!.id)
            res.success(campaign, 201)
        } catch (err) { next(err) }
    }

    async getCampaignById(req: Request, res: Response, next: NextFunction) {
        try {
            const campaign = await prospectService.getCampaignById(req.params.id, req.user!.organizationId)
            if (!campaign) return res.error('NOT_FOUND', 'Campaign not found', null, 404)
            res.success(campaign)
        } catch (err) { next(err) }
    }

    async sendCampaign(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.sendCampaign(req.params.id, req.user!.organizationId, req.user!.id)
            res.success(result)
        } catch (err) { next(err) }
    }

    async getCampaignMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const messages = await prospectService.getCampaignMessages(req.params.id)
            res.success(messages)
        } catch (err) { next(err) }
    }
}

export const prospectsController = new ProspectsController()
