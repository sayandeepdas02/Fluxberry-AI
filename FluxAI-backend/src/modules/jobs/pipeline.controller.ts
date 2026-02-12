import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { pipelineService } from './pipeline.service.js'

class PipelineController {
    async getStages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) { res.status(403).json({ success: false, error: { code: 'NO_ORGANIZATION' } }); return }

            const stages = await pipelineService.getStages(req.params.id, orgId)
            res.json({ success: true, data: stages })
        } catch (err: any) {
            if (err.code) { res.status(err.statusCode || 400).json({ success: false, error: err }); return }
            next(err)
        }
    }

    async addStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) { res.status(403).json({ success: false, error: { code: 'NO_ORGANIZATION' } }); return }

            const stage = await pipelineService.addStage(req.params.id, orgId, req.body)
            res.status(201).json({ success: true, data: stage })
        } catch (err: any) {
            if (err.code) { res.status(err.statusCode || 400).json({ success: false, error: err }); return }
            next(err)
        }
    }

    async reorderStages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) { res.status(403).json({ success: false, error: { code: 'NO_ORGANIZATION' } }); return }

            const stages = await pipelineService.reorderStages(req.params.id, orgId, req.body.stageIds)
            res.json({ success: true, data: stages })
        } catch (err: any) {
            if (err.code) { res.status(err.statusCode || 400).json({ success: false, error: err }); return }
            next(err)
        }
    }

    async removeStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) { res.status(403).json({ success: false, error: { code: 'NO_ORGANIZATION' } }); return }

            await pipelineService.removeStage(req.params.id, orgId, req.params.stageId)
            res.json({ success: true, data: { message: 'Stage removed' } })
        } catch (err: any) {
            if (err.code) { res.status(err.statusCode || 400).json({ success: false, error: err }); return }
            next(err)
        }
    }
}

export const pipelineController = new PipelineController()
