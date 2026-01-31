import prisma from '../../database/prisma.js'
import { ListQuestionsQuery, QuestionResponse, QuestionListResponse } from './questions.types.js'
import { Prisma } from '@prisma/client'

export class QuestionsService {
    /**
     * List questions with optional filters
     * Read-only - no mutations allowed
     */
    async list(query: ListQuestionsQuery): Promise<QuestionListResponse> {
        const where: Prisma.QuestionWhereInput = {}

        if (query.type) {
            where.type = query.type
        }

        if (query.difficulty) {
            where.difficulty = query.difficulty
        }

        if (query.topic) {
            where.topics = { has: query.topic }
        }

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                include: {
                    mcqDetails: true,
                    dsaDetails: true,
                },
                take: query.limit,
                skip: query.offset,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.question.count({ where }),
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
        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                mcqDetails: true,
                dsaDetails: true,
            },
        })

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
        const questions = await prisma.question.findMany({
            where: { id: { in: ids } },
            include: {
                mcqDetails: true,
                dsaDetails: true,
            },
        })

        return questions.map((q) => this.formatQuestion(q))
    }

    /**
     * Format question for response
     */
    private formatQuestion(question: {
        id: string
        type: string
        title: string
        difficulty: string
        topics: string[]
        metadata: Prisma.JsonValue
        mcqDetails: { options: string[]; correctOptions: number[]; isMultiCorrect: boolean } | null
        dsaDetails: { prompt: string; constraints: string | null; starterCode: Prisma.JsonValue; languagesSupported: string[] } | null
        createdAt: Date
    }): QuestionResponse {
        return {
            id: question.id,
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
                    constraints: question.dsaDetails.constraints,
                    starterCode: question.dsaDetails.starterCode as Record<string, string>,
                    languagesSupported: question.dsaDetails.languagesSupported,
                }
                : null,
            createdAt: question.createdAt,
        }
    }
}

export const questionsService = new QuestionsService()
