import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { prospectService } from './prospects.service.js'
import { prospectsScoringService } from './prospects.scoring.js'

class ProspectsController {
    // ── Prospects ────────────────────────────────────────
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.list(req.user!.organizationId as string, req.query as any)
            res.success(result)
        } catch (err) { next(err) }
    }

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const prospect = await prospectService.getById(req.params.id, req.user!.organizationId as string)
            if (!prospect) return res.error('NOT_FOUND', 'Prospect not found', null, 404)
            res.success(prospect)
        } catch (err) { next(err) }
    }

    async getProspectFit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const fit = await prospectsScoringService.evaluateProspectFit(req.params.id, req.user!.organizationId as string)
            res.success(fit || { score: 0, insights: ['No active jobs available for comparison.'] })
        } catch (err) { next(err) }
    }

    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const prospect = await prospectService.create(req.user!.organizationId as string, req.body, req.user!.id as string)
            res.success(prospect, 201)
        } catch (err) { next(err) }
    }

    async createBulk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.createBulk(req.user!.organizationId as string, req.body.prospects, req.user!.id as string)
            res.success(result, 201)
        } catch (err) { next(err) }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const prospect = await prospectService.update(req.params.id, req.user!.organizationId as string, req.body)
            if (!prospect) return res.error('NOT_FOUND', 'Prospect not found', null, 404)
            res.success(prospect)
        } catch (err) { next(err) }
    }

    async convertToCandidate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.convertToCandidate(req.params.id, req.user!.organizationId as string, req.user!.id as string)
            res.success(result)
        } catch (err) { next(err) }
    }

    // ── Lists ────────────────────────────────────────────
    async listLists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const lists = await prospectService.listLists(req.user!.organizationId as string)
            res.success(lists)
        } catch (err) { next(err) }
    }

    async createList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.createList(req.user!.organizationId as string, req.body, req.user!.id as string)
            res.success(list, 201)
        } catch (err) { next(err) }
    }

    async getListById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.getListById(req.params.id, req.user!.organizationId as string)
            if (!list) return res.error('NOT_FOUND', 'List not found', null, 404)
            res.success(list)
        } catch (err) { next(err) }
    }

    async addToList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.addToList(req.params.id, req.user!.organizationId as string, req.body.prospectIds)
            res.success(list)
        } catch (err) { next(err) }
    }

    async removeFromList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const list = await prospectService.removeFromList(req.params.id, req.user!.organizationId as string, req.body.prospectIds)
            res.success(list)
        } catch (err) { next(err) }
    }

    // ── Campaigns ────────────────────────────────────────
    async listCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const campaigns = await prospectService.listCampaigns(req.user!.organizationId as string)
            res.success(campaigns)
        } catch (err) { next(err) }
    }

    async createCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const campaign = await prospectService.createCampaign(req.user!.organizationId as string, req.body, req.user!.id as string)
            res.success(campaign, 201)
        } catch (err) { next(err) }
    }

    async getCampaignById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const campaign = await prospectService.getCampaignById(req.params.id, req.user!.organizationId as string)
            if (!campaign) return res.error('NOT_FOUND', 'Campaign not found', null, 404)
            res.success(campaign)
        } catch (err) { next(err) }
    }

    async sendCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const result = await prospectService.sendCampaign(req.params.id, req.user!.organizationId as string, req.user!.id as string)
            res.success(result)
        } catch (err) { next(err) }
    }

    async getCampaignMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const messages = await prospectService.getCampaignMessages(req.params.id)
            res.success(messages)
        } catch (err) { next(err) }
    }
}

export const prospectsController = new ProspectsController()
