import { Response, NextFunction } from 'express'
import { emailTemplateService } from './email-templates.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class EmailTemplateController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const template = await emailTemplateService.create(organizationId!, req.body)
            res.success(template, 201)
        } catch (error) {
            next(error)
        }
    }

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const templates = await emailTemplateService.list(organizationId!)
            res.success(templates)
        } catch (error) {
            next(error)
        }
    }

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const template = await emailTemplateService.getById(req.params.id, organizationId!)
            if (!template) throw AppError.notFound('Template')
            res.success(template)
        } catch (error) {
            next(error)
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const template = await emailTemplateService.update(req.params.id, organizationId!, req.body)
            if (!template) throw AppError.notFound('Template')
            res.success(template)
        } catch (error) {
            next(error)
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const success = await emailTemplateService.delete(req.params.id, organizationId!)
            if (!success) throw AppError.notFound('Template')
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    async send(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const { to, variables } = req.body as { to: string; variables?: Record<string, string> }
            if (!to) throw AppError.badRequest('"to" email address is required')
            const result = await emailTemplateService.sendEmail(req.params.id, organizationId!, to, variables ?? {})
            res.success(result)
        } catch (error) {
            next(error)
        }
    }
}

export const emailTemplateController = new EmailTemplateController()
