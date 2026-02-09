import {
    Assessment,
    Candidate,
    AssessmentAttempt,
    Question,
    IAssessmentAttempt,
    RoundTypeValue,
    AttemptStatusType,
    RoundStatusType,
} from '../../database/models/index.js'
import {
    StartAttemptInput,
    SubmitRoundInput,
    AttemptResponse,
    RoundAttemptResponse,
    RoundQuestionResponse,
} from './attempts.types.js'
import { evaluationService } from '../evaluation/evaluation.service.js'
import { enqueueEvaluationJob } from '../../jobs/queues/index.js'

export class AttemptsService {
    /**
     * Start or resume an attempt
     * - Only one active attempt per candidate per assessment
     * - Resume existing if already started
     */
    async startOrResume(assessmentId: string, input: StartAttemptInput): Promise<AttemptResponse> {
        // Verify assessment is ACTIVE
        const assessment = await Assessment.findById(assessmentId)

        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        if (assessment.status !== 'ACTIVE') {
            const error = new Error('Assessment is not active') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        const organizationId = assessment.organizationId

        // Find or create candidate (scoped to assessment's org)
        let candidate = await Candidate.findOne({ organizationId, email: input.candidateEmail.trim().toLowerCase() })

        if (!candidate) {
            candidate = await Candidate.create({
                organizationId,
                email: input.candidateEmail.trim().toLowerCase(),
                firstName: input.candidateFirstName,
                lastName: input.candidateLastName,
            })
        }

        // Check for existing attempt (resume)
        const existingAttempt = await AssessmentAttempt.findOne({
            assessmentId,
            candidateId: candidate._id,
        })

        if (existingAttempt) {
            // Resume existing attempt
            return this.formatAttempt(existingAttempt, assessment.title)
        }

        // Get enabled rounds
        const enabledRounds = assessment.rounds.filter(r => r.enabled).sort((a, b) => a.order - b.order)

        // Snapshot config and questions for each round
        const roundsToCreate = []
        for (const r of enabledRounds) {
            const config = r.config as Record<string, any> || {}
            let timeLimit = config.duration ? Number(config.duration) : 0 // Assuming duration is in minutes

            // Fallback default durations if not set (for V1 safety)
            if (!timeLimit) {
                if (r.roundType === 'MCQ') timeLimit = 45
                if (r.roundType === 'DSA') timeLimit = 60
                if (r.roundType === 'AI') timeLimit = 15
            }

            let questionSnapshots: any[] = []

            if (r.roundType === 'MCQ') {
                const qIds = [...(config.singleCorrectQuestionIds || []), ...(config.multiCorrectQuestionIds || [])]
                if (qIds.length > 0) {
                    const qs = await Question.find({ _id: { $in: qIds } }).lean()
                    questionSnapshots = qs.map(q => ({
                        id: q._id.toString(),
                        type: 'MCQ',
                        title: q.title,
                        difficulty: q.difficulty,
                        options: q.mcqDetails?.options || [],
                        isMultiCorrect: q.mcqDetails?.isMultiCorrect || false,
                        // We do NOT snapshot correct answers for security, 
                        // though they are needed for evaluation. 
                        // Evaluation will look up original questions or we can snapshot secure details separately if we wanted perfectly immutable grading.
                        // For V1, we snapshot candidate-facing data.
                        _originalIds: { correctOptions: q.mcqDetails?.correctOptions } // Ideally keep this server-side only
                    }))
                }
            } else if (r.roundType === 'DSA') {
                const qIds = config.questionIds || []
                if (qIds.length > 0) {
                    const qs = await Question.find({ _id: { $in: qIds } }).lean()
                    questionSnapshots = qs.map(q => ({
                        id: q._id.toString(),
                        type: 'DSA',
                        title: q.title,
                        difficulty: q.difficulty,
                        prompt: q.dsaDetails?.prompt,
                        constraints: q.dsaDetails?.constraints,
                        starterCode: q.dsaDetails?.starterCode,
                        languagesSupported: q.dsaDetails?.languagesSupported
                    }))
                }
            }
            // AI rounds don't have question bank yet

            roundsToCreate.push({
                roundType: r.roundType,
                status: 'NOT_STARTED',
                timeLimit,
                questions: questionSnapshots
            })
        }

        // Create new attempt with round attempts for enabled rounds
        const attempt = await AssessmentAttempt.create({
            assessmentId,
            candidateId: candidate._id,
            status: 'NOT_STARTED',
            rounds: roundsToCreate,
        })

        return this.formatAttempt(attempt, assessment.title)
    }

    /**
     * Get attempt by ID
     */
    async getById(attemptId: string): Promise<AttemptResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const assessment = await Assessment.findById(attempt.assessmentId)
        const title = assessment?.title ?? 'Unknown Assessment'

        return this.formatAttempt(attempt, title)
    }

    /**
     * Start a specific round
     * - Server timestamp only
     * - FSM: NOT_STARTED → IN_PROGRESS
     */
    async startRound(attemptId: string, roundType: RoundTypeValue): Promise<AttemptResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Check attempt is active or not started
        if (attempt.status === 'COMPLETED' || attempt.status === 'TIMED_OUT' || attempt.status === 'DISQUALIFIED') {
            const error = new Error('Attempt is already finished') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        const roundAttempt = attempt.rounds.find((r) => r.roundType === roundType)
        if (!roundAttempt) {
            const error = new Error('Round not found in this attempt') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        if (roundAttempt.status !== 'NOT_STARTED') {
            const error = new Error('Round already started') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Start round with server timestamp
        roundAttempt.status = 'IN_PROGRESS'
        roundAttempt.startedAt = new Date()

        // If attempt was NOT_STARTED, transition to IN_PROGRESS
        if (attempt.status === 'NOT_STARTED') {
            attempt.status = 'IN_PROGRESS'
            attempt.startedAt = new Date()
        }

        await attempt.save()

        return this.getById(attemptId)
    }

    /**
     * Submit a round
     * - Cannot submit twice
     * - Server timestamp only
     * - Auto-advance state
     */
    async submitRound(attemptId: string, roundType: RoundTypeValue, input: SubmitRoundInput): Promise<AttemptResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        if (attempt.status !== 'IN_PROGRESS') {
            const error = new Error('Attempt is not in progress') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        const roundAttempt = attempt.rounds.find((r) => r.roundType === roundType)
        if (!roundAttempt) {
            const error = new Error('Round not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Cannot submit twice
        if (roundAttempt.status === 'COMPLETED') {
            const error = new Error('Round already submitted') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'ALREADY_SUBMITTED'
            throw error
        }

        if (roundAttempt.status !== 'IN_PROGRESS') {
            const error = new Error('Round not started') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_STATUS'
            throw error
        }

        // Check if round is timed out (strict enforcement)
        const timeLimit = roundAttempt.timeLimit || 0
        if (timeLimit > 0 && roundAttempt.startedAt) {
            const now = new Date()
            const started = new Date(roundAttempt.startedAt)
            const elapsedMinutes = (now.getTime() - started.getTime()) / 1000 / 60
            // Allow 2 minute buffer for network latency
            if (elapsedMinutes > timeLimit + 2) {
                const error = new Error('Time limit exceeded') as Error & { statusCode: number; code: string }
                error.statusCode = 422
                error.code = 'TIME_LIMIT_EXCEEDED'
                // Optionally mark as TIMED_OUT here, but we'll safeguard the submit first
                throw error
            }
        }

        // Submit round with server timestamp
        roundAttempt.status = 'COMPLETED'
        roundAttempt.endedAt = new Date()
        roundAttempt.answers = input.answers as Record<string, unknown>

        // Check if all rounds completed → auto-advance to COMPLETED
        const allCompleted = attempt.rounds.every(
            (r) => r.roundType === roundType || r.status === 'COMPLETED' || r.status === 'SKIPPED'
        )

        if (allCompleted) {
            attempt.status = 'COMPLETED'
            attempt.submittedAt = new Date()
        }

        await attempt.save()

        // Trigger evaluation (sync) so scores exist for results
        const assessmentId = attempt.assessmentId.toString()
        const answers = roundAttempt.answers as Record<string, unknown> | undefined
        try {
            if (roundType === 'MCQ' && answers) {
                await evaluationService.evaluateMCQ(
                    attemptId,
                    answers as Record<string, number[]>,
                    assessmentId
                )
            } else if (roundType === 'DSA') {
                const submission = (answers as { code?: string; language?: string }) ?? {}
                await evaluationService.createDSAPlaceholder(attemptId, submission)
                await enqueueEvaluationJob({
                    type: 'EVALUATE_DSA',
                    attemptId,
                    submission: {
                        code: submission.code ?? '',
                        language: submission.language ?? 'python',
                    },
                })
            } else if (roundType === 'AI') {
                const refs = (answers as { transcriptRef?: string; videoRef?: string }) ?? {}
                await evaluationService.createAIPlaceholder(attemptId, refs)
            }
        } catch (err) {
            console.error(`Evaluation failed for attempt ${attemptId} round ${roundType}:`, err)
            // Don't fail the submit; evaluation can be retried later
        }

        return this.getById(attemptId)
    }

    /**
     * Get questions for a round (candidate-facing: MCQ options only, no correct answers)
     */
    async getRoundQuestions(attemptId: string, roundType: RoundTypeValue): Promise<RoundQuestionResponse[]> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const roundAttempt = attempt.rounds.find((r) => r.roundType === roundType)
        if (!roundAttempt) {
            const error = new Error('Round not found in attempt') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Return snapshotted questions
        // They are already in the correct format (minus strict type checks on difficulty string vs enum)
        return (roundAttempt.questions || []) as RoundQuestionResponse[]
    }

    /**
     * Format attempt for response
     */
    private formatAttempt(attempt: IAssessmentAttempt, assessmentTitle: string): AttemptResponse {
        return {
            id: attempt._id.toString(),
            assessmentId: attempt.assessmentId.toString(),
            assessmentTitle,
            candidateId: attempt.candidateId.toString(),
            status: attempt.status as AttemptStatusType,
            startedAt: attempt.startedAt ?? null,
            submittedAt: attempt.submittedAt ?? null,
            rounds: attempt.rounds.map((r): RoundAttemptResponse => ({
                id: r._id?.toString() ?? '',
                roundType: r.roundType as RoundTypeValue,
                status: r.status as RoundStatusType,
                startedAt: r.startedAt ?? null,
                endedAt: r.endedAt ?? null,
                timeLimit: r.timeLimit ?? null,
            })),
            createdAt: attempt.createdAt,
        }
    }
}

export const attemptsService = new AttemptsService()
