import prisma from '../../database/prisma.js'
import { RoundType, Prisma } from '@prisma/client'
import {
    EvaluationResult,
    MCQEvaluationMetadata,
    DSAEvaluationMetadata,
    AIEvaluationMetadata,
} from './evaluation.types.js'

export class EvaluationService {
    /**
     * Evaluate MCQ round - auto-grade on submission
     * Exact match required, no partial credit
     */
    async evaluateMCQ(
        attemptId: string,
        answers: Record<string, number[]>,
        assessmentId: string
    ): Promise<EvaluationResult> {
        // Get assessment round config for question IDs
        const assessmentRound = await prisma.assessmentRound.findUnique({
            where: {
                assessmentId_roundType: { assessmentId, roundType: 'MCQ' },
            },
        })

        if (!assessmentRound || !assessmentRound.config) {
            throw this.createError('MCQ round not configured', 422, 'INVALID_CONFIG')
        }

        const config = assessmentRound.config as {
            singleCorrectQuestionIds: string[]
            multiCorrectQuestionIds: string[]
        }

        const allQuestionIds = [
            ...config.singleCorrectQuestionIds,
            ...config.multiCorrectQuestionIds,
        ]

        // Fetch correct answers from question bank
        const questions = await prisma.mCQDetails.findMany({
            where: { questionId: { in: allQuestionIds } },
        })

        const questionMap = new Map(questions.map((q) => [q.questionId, q]))

        // Grade each answer
        let correctCount = 0
        const questionResults: MCQEvaluationMetadata['questionResults'] = []

        for (const questionId of allQuestionIds) {
            const question = questionMap.get(questionId)
            if (!question) continue

            const selectedOptions = answers[questionId] || []
            const correctOptions = question.correctOptions

            // Exact match - arrays must be identical
            const isCorrect =
                selectedOptions.length === correctOptions.length &&
                selectedOptions.every((opt) => correctOptions.includes(opt))

            if (isCorrect) correctCount++

            questionResults.push({
                questionId,
                correct: isCorrect,
                selectedOptions,
                correctOptions,
            })
        }

        const maxScore = allQuestionIds.length
        const score = correctCount

        const metadata: MCQEvaluationMetadata = {
            totalQuestions: maxScore,
            correctAnswers: score,
            questionResults,
        }

        // Create immutable evaluation record
        const evaluation = await prisma.evaluation.upsert({
            where: {
                attemptId_roundType: { attemptId, roundType: 'MCQ' },
            },
            create: {
                attemptId,
                roundType: 'MCQ',
                score,
                maxScore,
                metadata: metadata as unknown as Prisma.InputJsonValue,
            },
            update: {}, // No updates - immutable
        })

        return this.formatEvaluation(evaluation)
    }

    /**
     * Create placeholder DSA evaluation
     * Actual scoring happens via external service later
     */
    async createDSAPlaceholder(
        attemptId: string,
        submission: { code?: string; language?: string }
    ): Promise<EvaluationResult> {
        const metadata: DSAEvaluationMetadata = {
            code: submission.code,
            language: submission.language,
            status: 'PENDING',
        }

        const evaluation = await prisma.evaluation.upsert({
            where: {
                attemptId_roundType: { attemptId, roundType: 'DSA' },
            },
            create: {
                attemptId,
                roundType: 'DSA',
                score: 0, // Placeholder
                maxScore: 100,
                metadata: metadata as unknown as Prisma.InputJsonValue,
            },
            update: {}, // No updates - immutable until graded
        })

        return this.formatEvaluation(evaluation)
    }

    /**
     * Create placeholder AI evaluation
     * Actual scoring happens via AI service later
     */
    async createAIPlaceholder(
        attemptId: string,
        refs: { transcriptRef?: string; videoRef?: string }
    ): Promise<EvaluationResult> {
        const metadata: AIEvaluationMetadata = {
            transcriptRef: refs.transcriptRef,
            videoRef: refs.videoRef,
            summary: 'Pending AI evaluation',
            status: 'PENDING',
        }

        const evaluation = await prisma.evaluation.upsert({
            where: {
                attemptId_roundType: { attemptId, roundType: 'AI' },
            },
            create: {
                attemptId,
                roundType: 'AI',
                score: 0, // Placeholder
                maxScore: 100,
                metadata: metadata as unknown as Prisma.InputJsonValue,
            },
            update: {}, // No updates - immutable until graded
        })

        return this.formatEvaluation(evaluation)
    }

    /**
     * Get evaluations for an attempt
     */
    async getByAttemptId(attemptId: string): Promise<EvaluationResult[]> {
        const evaluations = await prisma.evaluation.findMany({
            where: { attemptId },
            orderBy: { roundType: 'asc' },
        })

        return evaluations.map((e) => this.formatEvaluation(e))
    }

    /**
     * Format evaluation for response
     */
    private formatEvaluation(evaluation: {
        id: string
        roundType: RoundType
        score: number
        maxScore: number
        metadata: Prisma.JsonValue
        evaluatedAt: Date
    }): EvaluationResult {
        return {
            id: evaluation.id,
            roundType: evaluation.roundType,
            score: evaluation.score,
            maxScore: evaluation.maxScore,
            percentage: evaluation.maxScore > 0
                ? Math.round((evaluation.score / evaluation.maxScore) * 100)
                : 0,
            metadata: evaluation.metadata as Record<string, unknown> | null,
            evaluatedAt: evaluation.evaluatedAt,
        }
    }

    private createError(message: string, statusCode: number, code: string) {
        const error = new Error(message) as Error & { statusCode: number; code: string }
        error.statusCode = statusCode
        error.code = code
        return error
    }
}

export const evaluationService = new EvaluationService()
