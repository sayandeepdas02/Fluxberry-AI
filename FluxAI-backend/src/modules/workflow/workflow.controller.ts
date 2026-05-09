import { Response, NextFunction } from 'express'
import { workflowService } from './workflow.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class WorkflowController {
    async createRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const rule = await workflowService.createRule(organizationId!, req.body)
            res.success(rule, 201)
        } catch (error) {
            next(error)
        }
    }

    async getRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const rules = await workflowService.getRules(organizationId!)
            res.success(rules)
        } catch (error) {
            next(error)
        }
    }

    async getRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const rule = await workflowService.getRule(req.params.id, organizationId!)
            if (!rule) throw AppError.notFound('Rule')
            res.success(rule)
        } catch (error) {
            next(error)
        }
    }

    async updateRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const rule = await workflowService.updateRule(req.params.id, organizationId!, req.body)
            if (!rule) throw AppError.notFound('Rule')
            res.success(rule)
        } catch (error) {
            next(error)
        }
    }

    async deleteRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const success = await workflowService.deleteRule(req.params.id, organizationId!)
            if (!success) throw AppError.notFound('Rule')
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }
}

export const workflowController = new WorkflowController()
