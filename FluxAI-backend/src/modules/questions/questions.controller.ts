import { Request, Response, NextFunction } from 'express'
import { questionsService } from './questions.service.js'
import { listQuestionsQuerySchema, createQuestionBodySchema, updateQuestionBodySchema } from './questions.types.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class QuestionsController {
    /**
     * GET /api/questions
     * List questions — returns org's own + global seeded questions.
     */
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = listQuestionsQuerySchema.parse(req.query)
            const organizationId = (req as AuthenticatedRequest).user?.organizationId ?? undefined
            const result = await questionsService.list(query, organizationId ?? undefined)
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/questions/:id
     */
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const question = await questionsService.getById(id)
            res.success(question)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/questions
     * Create a question owned by the authenticated org.
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const body = createQuestionBodySchema.parse(req.body)
            const organizationId = (req as AuthenticatedRequest).user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization required to create questions')
            }
            const question = await questionsService.create(body, organizationId)
            res.success(question, 201)
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/questions/:id
     * Update a question (org-owned only).
     */
    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const body = updateQuestionBodySchema.parse(req.body)
            const organizationId = (req as AuthenticatedRequest).user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization required')
            }
            const question = await questionsService.update(id, body, organizationId)
            res.success(question)
        } catch (error) {
            next(error)
        }
    }

    /**
     * DELETE /api/questions/:id
     * Hard-delete a question (org-owned only).
     */
    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const organizationId = (req as AuthenticatedRequest).user?.organizationId
            if (!organizationId) {
                throw AppError.forbidden('Organization required')
            }
            await questionsService.delete(id, organizationId)
            res.success({ deleted: true })
        } catch (error) {
            next(error)
        }
    }
}

export const questionsController = new QuestionsController()
