import { Request, Response } from 'express'
import { emailTemplateService } from './email-templates.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class EmailTemplateController {
    async create(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const template = await emailTemplateService.create(organizationId!, req.body)
            res.status(201).json(template)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async list(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const templates = await emailTemplateService.list(organizationId!)
            res.json(templates)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const template = await emailTemplateService.getById(id, organizationId!)
            if (!template) return res.status(404).json({ message: 'Template not found' })
            res.json(template)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const template = await emailTemplateService.update(id, organizationId!, req.body)
            if (!template) return res.status(404).json({ message: 'Template not found' })
            res.json(template)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const success = await emailTemplateService.delete(id, organizationId!)
            if (!success) return res.status(404).json({ message: 'Template not found' })
            res.status(204).send()
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
}

export const emailTemplateController = new EmailTemplateController()
