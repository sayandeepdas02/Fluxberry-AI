import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { OfferTemplate } from '../../database/models/index.js'
import { templateService } from './template.service.js'
import { AppError } from '../../common/errors/index.js'

export class OffersTemplateController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            if (!organizationId) throw AppError.forbidden('Organization context required')
            const { name, htmlContent, type = 'FULL_TIME', country } = req.body
            const template = await OfferTemplate.create({
                organizationId,
                name,
                htmlContent,
                type,
                country,
                variables: templateService.extractVariables(htmlContent),
                isActive: true,
            })
            res.success(template, 201)
        } catch (error) {
            next(error)
        }
    }

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const templates = await OfferTemplate.find({ organizationId }).sort({ createdAt: -1 })
            res.success(templates)
        } catch (error) {
            next(error)
        }
    }

    async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const template = await OfferTemplate.findOne({
                _id: req.params.id,
                organizationId: req.user?.organizationId,
            })
            if (!template) throw AppError.notFound('Template')
            res.success(template)
        } catch (error) {
            next(error)
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { name, htmlContent, type, country, isActive } = req.body
            const template = await OfferTemplate.findOne({
                _id: req.params.id,
                organizationId: req.user?.organizationId,
            })
            if (!template) throw AppError.notFound('Template')
            if (name) template.name = name
            if (htmlContent) {
                template.htmlContent = htmlContent
                template.variables = templateService.extractVariables(htmlContent)
            }
            if (type) template.type = type
            if (country) template.country = country
            if (isActive !== undefined) template.isActive = isActive
            await template.save()
            res.success(template)
        } catch (error) {
            next(error)
        }
    }
}

export const offersTemplateController = new OffersTemplateController()
