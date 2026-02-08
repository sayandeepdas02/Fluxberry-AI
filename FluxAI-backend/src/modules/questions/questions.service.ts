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
     * List questions with optional filters
     * Read-only - no mutations allowed
     */
    async list(query: ListQuestionsQuery): Promise<QuestionListResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: Record<string, any> = {}

        if (query.type) {
            filter.type = query.type
        }

        if (query.difficulty) {
            filter.difficulty = query.difficulty
        }

        if (query.topic) {
            filter.topics = query.topic
        }

        const [questions, total] = await Promise.all([
            Question.find(filter)
                .limit(query.limit)
                .skip(query.offset)
                .sort({ createdAt: -1 }),
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
     * Create a new question (MCQ or DSA with optional test cases)
     */
    async create(body: CreateQuestionBody): Promise<QuestionResponse> {
        const doc: Record<string, unknown> = {
            type: body.type,
            title: body.title,
            difficulty: body.difficulty,
            topics: body.topics ?? [],
            metadata: body.metadata ?? undefined,
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
        const question = await Question.create(doc as IQuestion)
        return this.formatQuestion(question as IQuestion)
    }

    /**
     * Update an existing question (partial)
     */
    async update(id: string, body: UpdateQuestionBody): Promise<QuestionResponse> {
        const question = await Question.findById(id)
        if (!question) {
            const error = new Error('Question not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }
        if (body.title != null) question.title = body.title
        if (body.difficulty != null) question.difficulty = body.difficulty
        if (body.topics != null) question.topics = body.topics
        if (body.metadata !== undefined) question.metadata = body.metadata
        if (body.type != null) question.type = body.type
        if (body.mcqDetails != null) question.mcqDetails = body.mcqDetails
        if (body.dsaDetails != null) {
            const existing = question.dsaDetails ?? {}
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
     * Get a single question by ID
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
     * Get questions by IDs (for validation)
     */
    async getByIds(ids: string[]): Promise<QuestionResponse[]> {
        const questions = await Question.find({ _id: { $in: ids } })
        return questions.map((q) => this.formatQuestion(q))
    }

    /**
     * Format question for response
     */
    private formatQuestion(question: IQuestion): QuestionResponse {
        return {
            id: question._id.toString(),
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
