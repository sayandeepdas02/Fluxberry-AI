import { Request, Response, NextFunction } from 'express'
import { questionsService } from './questions.service.js'
import { listQuestionsQuerySchema, createQuestionBodySchema, updateQuestionBodySchema } from './questions.types.js'
import { successResponse } from '../../common/utils/api-response.js'

export class QuestionsController {
    /**
     * GET /api/questions
     * List questions with optional filters
     */
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = listQuestionsQuerySchema.parse(req.query)
            const result = await questionsService.list(query)
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/questions/:id
     * Get a single question
     */
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const question = await questionsService.getById(id)
            res.json(successResponse(question))
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/questions
     * Create a question (MCQ or DSA; DSA can include test cases)
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const body = createQuestionBodySchema.parse(req.body)
            const question = await questionsService.create(body)
            res.status(201).json(successResponse(question))
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/questions/:id
     * Update a question (partial; e.g. add or edit DSA test cases)
     */
    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params
            const body = updateQuestionBodySchema.parse(req.body)
            const question = await questionsService.update(id, body)
            res.json(successResponse(question))
        } catch (error) {
            next(error)
        }
    }
}

export const questionsController = new QuestionsController()
