import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { pipelineService } from './pipeline.service.js'
import { AppError } from '../../common/errors/index.js'

class PipelineController {
    async getStages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const stages = await pipelineService.getStages(req.params.id, orgId)
            res.success(stages)
        } catch (err) {
            next(err)
        }
    }

    async addStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const stage = await pipelineService.addStage(req.params.id, orgId, req.body)
            res.success(stage, 201)
        } catch (err) {
            next(err)
        }
    }

    async reorderStages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const stages = await pipelineService.reorderStages(req.params.id, orgId, req.body.stageIds)
            res.success(stages)
        } catch (err) {
            next(err)
        }
    }

    async removeStage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            await pipelineService.removeStage(req.params.id, orgId, req.params.stageId)
            res.success({ message: 'Stage removed' })
        } catch (err) {
            next(err)
        }
    }
}

export const pipelineController = new PipelineController()
