import { Response } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { OfferTemplate } from '../../database/models/index.js'
import { templateService } from './template.service.js'

export class OffersTemplateController {

    // Create Template
    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) return res.status(403).json({ error: 'Organization context required' })

            const { name, content, variableSchema } = req.body

            // Extract variables if not provided schema, or just use extractor helper
            const extractedVars = templateService.extractVariables(content)

            // If schema not provided, build basic one
            const finalSchema = variableSchema || extractedVars.reduce((acc: any, key: string) => {
                acc[key] = { type: 'text', label: key }
                return acc
            }, {})

            const template = await OfferTemplate.create({
                organizationId,
                name,
                content,
                variables: extractedVars,
                variableSchema: finalSchema,
                isActive: true
            })

            res.status(201).json(template)
        } catch (error: any) {
            res.status(400).json({ error: error.message })
        }
    }

    // List Templates
    async list(req: AuthenticatedRequest, res: Response) {
        try {
            const organizationId = req.user?.organizationId
            const templates = await OfferTemplate.find({ organizationId }).sort({ createdAt: -1 })
            res.json(templates)
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }

    // Get Template
    async get(req: AuthenticatedRequest, res: Response) {
        try {
            const template = await OfferTemplate.findOne({
                _id: req.params.id,
                organizationId: req.user?.organizationId
            })
            if (!template) return res.status(404).json({ error: 'Template not found' })
            res.json(template)
        } catch (error: any) {
            res.status(500).json({ error: error.message })
        }
    }

    // Update Template
    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const { name, content, variableSchema, isActive } = req.body
            const template = await OfferTemplate.findOne({
                _id: req.params.id,
                organizationId: req.user?.organizationId
            })

            if (!template) return res.status(404).json({ error: 'Template not found' })

            if (name) template.name = name
            if (content) {
                template.content = content
                template.variables = templateService.extractVariables(content)
            }
            if (variableSchema) template.variableSchema = variableSchema
            if (isActive !== undefined) template.isActive = isActive

            await template.save()
            res.json(template)
        } catch (error: any) {
            res.status(400).json({ error: error.message })
        }
    }
}

export const offersTemplateController = new OffersTemplateController()
