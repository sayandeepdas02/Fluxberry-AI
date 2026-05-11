import { Request, Response, NextFunction } from 'express'
import { sourcingService } from './sourcing.service.js'
import { enrichmentService } from './enrichment.service.js'

class SourcingController {
    async importLinkedIn(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const result = await sourcingService.importLinkedInProfiles(orgId, req.body.profiles, userId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async importGitHub(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const result = await sourcingService.importGitHubProfiles(orgId, req.body.profiles, userId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async importBulk(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const userId = (req as any).userId
            const result = await sourcingService.importBulkCandidates(orgId, req.body.candidates, userId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async deduplicate(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await sourcingService.deduplicateCandidates(orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async tagCampaign(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await sourcingService.tagSourceCampaign(orgId, req.body.candidateIds, req.body.tag)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async enrichProspect(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await enrichmentService.enrichProspect(req.params.prospectId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }
}

export const sourcingController = new SourcingController()
