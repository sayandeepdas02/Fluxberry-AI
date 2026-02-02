import { Question, IQuestion } from '../../database/models/index.js'
import { ListQuestionsQuery, QuestionResponse, QuestionListResponse } from './questions.types.js'

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
                }
                : null,
            createdAt: question.createdAt,
        }
    }
}

export const questionsService = new QuestionsService()
