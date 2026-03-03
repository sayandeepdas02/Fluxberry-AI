import {
    Assessment,
    Question,
    Evaluation,
    RoundTypeValue,
} from '../../database/models/index.js'
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
        // Get assessment for round config
        const assessment = await Assessment.findById(assessmentId)

        if (!assessment) {
            throw this.createError('Assessment not found', 404, 'NOT_FOUND')
        }

        const mcqRound = assessment.rounds.find(r => r.roundType === 'MCQ')
        if (!mcqRound || !mcqRound.config) {
            throw this.createError('MCQ round not configured', 422, 'INVALID_CONFIG')
        }

        const config = mcqRound.config as {
            singleCorrectQuestionIds?: string[]
            multiCorrectQuestionIds?: string[]
        }

        const allQuestionIds = [
            ...(config.singleCorrectQuestionIds || []),
            ...(config.multiCorrectQuestionIds || []),
        ]

        // Fetch correct answers from question bank
        const questions = await Question.find({
            _id: { $in: allQuestionIds },
            type: 'MCQ',
        })

        const questionMap = new Map(questions.map((q) => [q._id.toString(), q.mcqDetails]))

        // Grade each answer
        let correctCount = 0
        const questionResults: MCQEvaluationMetadata['questionResults'] = []

        for (const questionId of allQuestionIds) {
            const mcqDetails = questionMap.get(questionId)
            if (!mcqDetails) continue

            const selectedOptions = answers[questionId] || []
            const correctOptions = mcqDetails.correctOptions

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

        // Create immutable evaluation record (upsert)
        let evaluation = await Evaluation.findOne({ attemptId, roundType: 'MCQ' })

        if (!evaluation) {
            evaluation = await Evaluation.create({
                attemptId,
                roundType: 'MCQ',
                score,
                maxScore,
                metadata,
            })
        }

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

        let evaluation = await Evaluation.findOne({ attemptId, roundType: 'DSA' })

        if (!evaluation) {
            evaluation = await Evaluation.create({
                attemptId,
                roundType: 'DSA',
                score: 0, // Placeholder
                maxScore: 100,
                metadata,
            })
        }

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

        let evaluation = await Evaluation.findOne({ attemptId, roundType: 'AI' })

        if (!evaluation) {
            evaluation = await Evaluation.create({
                attemptId,
                roundType: 'AI',
                score: 0, // Placeholder
                maxScore: 100,
                metadata,
            })
        }

        return this.formatEvaluation(evaluation)
    }

    /**
     * Finalize AI evaluation with the actual orchestrator score.
     * Upserts the Evaluation record — replaces any prior placeholder.
     * Called by InterviewOrchestrator.completeSession().
     */
    async finalizeAIEvaluation(
        attemptId: string,
        score: number,
        metadata: Record<string, unknown>
    ): Promise<EvaluationResult> {
        const evaluation = await Evaluation.findOneAndUpdate(
            { attemptId, roundType: 'AI' },
            {
                $set: {
                    score: Math.round(score),
                    maxScore: 100,
                    metadata: { ...metadata, status: 'COMPLETED' },
                    evaluatedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        )

        return this.formatEvaluation(evaluation!)
    }


    /**
     * Get evaluations for an attempt
     */
    async getByAttemptId(attemptId: string): Promise<EvaluationResult[]> {
        const evaluations = await Evaluation.find({ attemptId }).sort({ roundType: 1 })
        return evaluations.map((e) => this.formatEvaluation(e))
    }

    /**
     * Format evaluation for response
     */
    private formatEvaluation(evaluation: {
        _id: { toString(): string }
        roundType: RoundTypeValue
        score: number
        maxScore: number
        metadata?: Record<string, unknown>
        evaluatedAt: Date
    }): EvaluationResult {
        return {
            id: evaluation._id.toString(),
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
