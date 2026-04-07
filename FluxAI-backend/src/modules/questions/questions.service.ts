import { Question, IQuestion } from '../../database/models/index.js'
import {
    ListQuestionsQuery,
    QuestionResponse,
    QuestionListResponse,
    CreateQuestionBody,
    UpdateQuestionBody,
} from './questions.types.js'

export class QuestionsService {
    /**
     * List questions for a given org.
     * Returns both org-owned questions AND global seeded questions (organizationId: null).
     */
    async list(query: ListQuestionsQuery, organizationId?: string): Promise<QuestionListResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: Record<string, any> = {}

        // Org filter: show org's own questions + global seeded questions
        if (organizationId) {
            filter.$or = [
                { organizationId },
                { organizationId: null },
            ]
        }

        if (query.type) filter.type = query.type
        if (query.difficulty) filter.difficulty = query.difficulty
        if (query.topic) filter.topics = query.topic
        if (query.search) filter.title = { $regex: query.search, $options: 'i' }

        const [questions, total] = await Promise.all([
            Question.find(filter)
                .limit(query.limit)
                .skip(query.offset)
                .sort({ organizationId: -1, createdAt: -1 }), // org questions first
            Question.countDocuments(filter),
        ])

        return {
            data: questions.map((q) => this.formatQuestion(q)),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    /**
     * Create a new question owned by the given org (MCQ or DSA).
     */
    async create(body: CreateQuestionBody, organizationId: string): Promise<QuestionResponse> {
        const doc: Record<string, unknown> = {
            type: body.type,
            title: body.title,
            difficulty: body.difficulty,
            topics: body.topics ?? [],
            metadata: body.metadata ?? undefined,
            organizationId,
        }
        if (body.type === 'MCQ' && body.mcqDetails) {
            doc.mcqDetails = body.mcqDetails
        }
        if (body.type === 'DSA' && body.dsaDetails) {
            doc.dsaDetails = {
                prompt: body.dsaDetails.prompt,
                constraints: body.dsaDetails.constraints ?? undefined,
                starterCode: body.dsaDetails.starterCode,
                languagesSupported: body.dsaDetails.languagesSupported,
                testCases: body.dsaDetails.testCases,
            }
        }
        const question = await Question.create(doc as unknown as IQuestion)
        return this.formatQuestion(question as IQuestion)
    }

    /**
     * Update an existing question. Org-owned questions only.
     */
    async update(id: string, body: UpdateQuestionBody, organizationId: string): Promise<QuestionResponse> {
        const question = await Question.findById(id)
        if (!question) {
            const error = new Error('Question not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Only allow editing questions this org owns (not global seeded questions)
        if (question.organizationId?.toString() !== organizationId) {
            const error = new Error('Cannot edit a question you do not own') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }

        if (body.title != null) question.title = body.title
        if (body.difficulty != null) question.difficulty = body.difficulty
        if (body.topics != null) question.topics = body.topics
        if (body.metadata !== undefined) question.metadata = body.metadata as Record<string, unknown> | undefined
        if (body.type != null) question.type = body.type
        if (body.mcqDetails != null) question.mcqDetails = body.mcqDetails
        if (body.dsaDetails != null) {
            const existing = question.dsaDetails ?? ({} as any)
            question.dsaDetails = {
                prompt: body.dsaDetails.prompt ?? existing.prompt ?? '',
                constraints: body.dsaDetails.constraints !== undefined ? body.dsaDetails.constraints ?? undefined : existing.constraints,
                starterCode: body.dsaDetails.starterCode && Object.keys(body.dsaDetails.starterCode).length > 0
                    ? body.dsaDetails.starterCode
                    : (existing.starterCode as Record<string, string>) ?? {},
                languagesSupported: body.dsaDetails.languagesSupported?.length
                    ? body.dsaDetails.languagesSupported
                    : existing.languagesSupported ?? [],
                testCases: body.dsaDetails.testCases !== undefined ? body.dsaDetails.testCases : existing.testCases,
            }
        }
        await question.save()
        return this.formatQuestion(question as IQuestion)
    }

    /**
     * Delete a question (org-owned only).
     */
    async delete(id: string, organizationId: string): Promise<void> {
        const question = await Question.findById(id)
        if (!question) {
            const error = new Error('Question not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }
        if (question.organizationId?.toString() !== organizationId) {
            const error = new Error('Cannot delete a question you do not own') as Error & { statusCode: number; code: string }
            error.statusCode = 403
            error.code = 'FORBIDDEN'
            throw error
        }
        await question.deleteOne()
    }

    /**
     * Get a single question by ID.
     */
    async getById(id: string): Promise<QuestionResponse> {
        const question = await Question.findById(id)
        if (!question) {
            const error = new Error('Question not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }
        return this.formatQuestion(question)
    }

    /**
     * Get questions by IDs (strict ObjectId only — no slug fallback).
     * Throws 400 if any ID is not a valid ObjectId.
     */
    async getByIds(ids: string[]): Promise<QuestionResponse[]> {
        if (ids.length === 0) return []
        const { Types } = await import('mongoose')

        const invalid = ids.filter(
            id => !Types.ObjectId.isValid(id) || String(new Types.ObjectId(id)) !== id
        )
        if (invalid.length > 0) {
            const error = new Error(
                `Invalid question IDs: [${invalid.join(', ')}]. All IDs must be valid database ObjectIds.`
            ) as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_QUESTION_IDS'
            throw error
        }

        const questions = await Question.find({ _id: { $in: ids } })
        return questions.map((q) => this.formatQuestion(q))
    }

    /**
     * Format question for API response
     */
    private formatQuestion(question: IQuestion): QuestionResponse {
        return {
            id: question._id.toString(),
            slug: question.slug,
            organizationId: question.organizationId?.toString() ?? null,
            type: question.type as 'MCQ' | 'DSA',
            title: question.title,
            difficulty: question.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
            topics: question.topics,
            metadata: question.metadata as Record<string, unknown> | null,
            mcqDetails: question.mcqDetails
                ? {
                    options: question.mcqDetails.options,
                    correctOptions: question.mcqDetails.correctOptions,
                    isMultiCorrect: question.mcqDetails.isMultiCorrect,
                }
                : null,
            dsaDetails: question.dsaDetails
                ? {
                    prompt: question.dsaDetails.prompt,
                    constraints: question.dsaDetails.constraints ?? null,
                    starterCode: question.dsaDetails.starterCode as Record<string, string>,
                    languagesSupported: question.dsaDetails.languagesSupported,
                    testCases: question.dsaDetails.testCases,
                }
                : null,
            createdAt: question.createdAt,
        }
    }
}

export const questionsService = new QuestionsService()
