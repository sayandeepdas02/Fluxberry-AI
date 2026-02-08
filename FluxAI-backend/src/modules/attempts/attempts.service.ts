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

        // Create new attempt with round attempts for enabled rounds
        const attempt = await AssessmentAttempt.create({
            assessmentId,
            candidateId: candidate._id,
            status: 'NOT_STARTED',
            rounds: enabledRounds.map((r) => ({
                roundType: r.roundType,
                status: 'NOT_STARTED',
            })),
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

        const assessment = await Assessment.findById(attempt.assessmentId)
        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const round = assessment.rounds.find((r) => r.roundType === roundType)
        if (!round || !round.config) {
            const error = new Error('Round not configured') as Error & { statusCode: number; code: string }
            error.statusCode = 422
            error.code = 'INVALID_CONFIG'
            throw error
        }

        const config = round.config as Record<string, unknown>
        let questionIds: string[] = []

        if (roundType === 'MCQ') {
            const single = (config.singleCorrectQuestionIds as string[]) || []
            const multi = (config.multiCorrectQuestionIds as string[]) || []
            questionIds = [...single, ...multi]
        } else if (roundType === 'DSA') {
            questionIds = (config.questionIds as string[]) || []
        }
        // AI round has no question bank in config (agent/questions TBD)

        if (questionIds.length === 0) {
            return []
        }

        const questions = await Question.find({ _id: { $in: questionIds } }).sort({ createdAt: 1 })

        return questions.map((q) => {
            if (q.type === 'MCQ' && q.mcqDetails) {
                return {
                    id: q._id.toString(),
                    type: 'MCQ' as const,
                    title: q.title,
                    difficulty: q.difficulty,
                    options: q.mcqDetails.options,
                    isMultiCorrect: q.mcqDetails.isMultiCorrect ?? false,
                }
            }
            if (q.type === 'DSA' && q.dsaDetails) {
                return {
                    id: q._id.toString(),
                    type: 'DSA' as const,
                    title: q.title,
                    difficulty: q.difficulty,
                    prompt: q.dsaDetails.prompt ?? '',
                    constraints: q.dsaDetails.constraints ?? null,
                    starterCode: (q.dsaDetails.starterCode as Record<string, string>) ?? {},
                    languagesSupported: q.dsaDetails.languagesSupported ?? [],
                }
            }
            return null
        }).filter((q): q is RoundQuestionResponse => q !== null)
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
            })),
            createdAt: attempt.createdAt,
        }
    }
}

export const attemptsService = new AttemptsService()
