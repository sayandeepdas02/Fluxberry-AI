import { Request, Response } from 'express'
import { workflowService } from './workflow.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class WorkflowController {
    async createRule(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const rule = await workflowService.createRule(organizationId!, req.body)
            res.status(201).json(rule)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async getRules(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const rules = await workflowService.getRules(organizationId!)
            res.json(rules)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async getRule(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const rule = await workflowService.getRule(id, organizationId!)
            if (!rule) return res.status(404).json({ message: 'Rule not found' })
            res.json(rule)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async updateRule(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const rule = await workflowService.updateRule(id, organizationId!, req.body)
            if (!rule) return res.status(404).json({ message: 'Rule not found' })
            res.json(rule)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async deleteRule(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const success = await workflowService.deleteRule(id, organizationId!)
            if (!success) return res.status(404).json({ message: 'Rule not found' })
            res.status(204).send()
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
}

export const workflowController = new WorkflowController()
