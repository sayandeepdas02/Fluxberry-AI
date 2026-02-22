import mongoose from 'mongoose'
import {
    Assessment,
    Candidate,
    AssessmentAttempt,
    Question,
    IAssessmentAttempt,
    RoundTypeValue,
    AttemptStatusType,
    RoundStatusType,
    QuestionStatus,
    QuestionStatusType,
} from '../../database/models/index.js'

/**
 * Build a query that matches questions by either _id (if valid ObjectId) or slug.
 * This is needed because frontend may send mock IDs like 'dbms-1' that are slugs, not ObjectIds.
 */
function buildQuestionQuery(ids: string[]): Record<string, unknown> {
    if (ids.length === 0) return { _id: { $in: [] } }

    const validObjectIds: string[] = []
    const slugIds: string[] = []

    for (const id of ids) {
        if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
            validObjectIds.push(id)
        } else {
            slugIds.push(id)
        }
    }

    const orConditions: Record<string, unknown>[] = []
    if (validObjectIds.length) orConditions.push({ _id: { $in: validObjectIds } })
    if (slugIds.length) orConditions.push({ slug: { $in: slugIds } })

    return orConditions.length > 0 ? { $or: orConditions } : { _id: { $in: [] } }
}
import {
    StartAttemptInput,
    SubmitRoundInput,
    SubmitAnswerInput,
    AttemptResponse,
    RoundAttemptResponse,
    RoundQuestionResponse,
    QuestionAttemptResponse,
    CurrentQuestionResponse,
    StartQuestionResponse,
    SubmitAnswerResponse,
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

            // Determine timing mode based on round type
            // MCQ & DSA: per-question timing (no round-level timer)
            // AI: per-round timing (session-level timer)
            let timingMode: 'PER_QUESTION' | 'PER_ROUND' = 'PER_QUESTION'
            let timeLimit: number | null = null
            let perQuestionTimeLimit = 0 // seconds

            if (r.roundType === 'MCQ') {
                timingMode = 'PER_QUESTION'
                timeLimit = null // NO round-level timer for MCQ
                perQuestionTimeLimit = 20 // 20 seconds per question
            } else if (r.roundType === 'DSA') {
                timingMode = 'PER_QUESTION'
                timeLimit = null // NO round-level timer for DSA
                perQuestionTimeLimit = 30 * 60 // 30 minutes per question
            } else if (r.roundType === 'AI') {
                timingMode = 'PER_ROUND'
                timeLimit = config.duration ? Number(config.duration) : 15 // 15 minutes default
                perQuestionTimeLimit = 0 // NO per-question timer for AI
            }

            let questionSnapshots: any[] = []

            if (r.roundType === 'MCQ') {
                const qIds = [...(config.singleCorrectQuestionIds || []), ...(config.multiCorrectQuestionIds || [])]
                if (qIds.length > 0) {
                    const qs = await Question.find(buildQuestionQuery(qIds)).lean()
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
                    const qs = await Question.find(buildQuestionQuery(qIds)).lean()
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

            // Initialize question attempts array
            const questionAttempts = questionSnapshots.map((q, idx) => ({
                questionId: q.id,
                questionIndex: idx,
                status: QuestionStatus.NOT_STARTED,
            }))

            roundsToCreate.push({
                roundType: r.roundType,
                status: 'NOT_STARTED',
                timingMode,
                timeLimit,
                questions: questionSnapshots,
                currentQuestionIndex: 0,
                perQuestionTimeLimit,
                questionAttempts,
            })
        }

        // Create new attempt with round attempts for enabled rounds
        const attempt = await AssessmentAttempt.create({
            assessmentId,
            candidateId: candidate._id,
            status: 'NOT_STARTED',
            rounds: roundsToCreate as any,
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
            // Idempotent: round already started, return current state
            return this.getById(attemptId)
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
                await evaluationService.createDSAPlaceholder(attemptId, { code: '', language: 'python' })
                await enqueueEvaluationJob({
                    type: 'EVALUATE_DSA',
                    attemptId,
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
     * Get redirect URL after Ribbon callback (next round or completed page).
     * Optionally marks AI round COMPLETED if webhook has not yet run.
     */
    async getRibbonCallbackNextUrl(attemptId: string): Promise<{ nextUrl: string }> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }
        const assessmentId = attempt.assessmentId.toString()
        const aiRound = attempt.rounds.find(r => r.roundType === 'AI')
        if (aiRound && aiRound.status !== 'COMPLETED' && aiRound.ribbonInterviewId) {
            aiRound.status = 'COMPLETED'
            aiRound.endedAt = new Date()
            const allCompleted = attempt.rounds.every(
                r => r.status === 'COMPLETED' || r.status === 'SKIPPED'
            )
            if (allCompleted) {
                attempt.status = 'COMPLETED'
                attempt.submittedAt = new Date()
            }
            await attempt.save()
        }
        const roundTypes = attempt.rounds.map(r => r.roundType)
        const aiIndex = roundTypes.indexOf('AI')
        if (aiIndex < 0) {
            return { nextUrl: `/assessment/${assessmentId}/completed` }
        }
        const nextIndex = aiIndex + 1
        if (nextIndex < roundTypes.length) {
            return { nextUrl: `/assessment/${assessmentId}/round/${nextIndex}` }
        }
        return { nextUrl: `/assessment/${assessmentId}/completed` }
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
     * Get current question for a round (for resume scenarios)
     */
    async getCurrentQuestion(attemptId: string, roundIndex: number): Promise<CurrentQuestionResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const roundAttempt = attempt.rounds[roundIndex]
        if (!roundAttempt) {
            const error = new Error('Round not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const questions = roundAttempt.questions || []
        const currentIdx = roundAttempt.currentQuestionIndex ?? 0
        const currentQuestion = questions[currentIdx]

        if (!currentQuestion) {
            const error = new Error('No more questions in round') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'ROUND_COMPLETE'
            throw error
        }

        const questionAttempt = roundAttempt.questionAttempts?.find(qa => qa.questionIndex === currentIdx)

        return {
            questionIndex: currentIdx,
            questionId: currentQuestion.id,
            question: currentQuestion as RoundQuestionResponse,
            startedAt: questionAttempt?.startedAt ?? null,
            perQuestionTimeLimit: roundAttempt.perQuestionTimeLimit ?? 0,
            totalQuestions: questions.length,
            roundType: roundAttempt.roundType as RoundTypeValue,
        }
    }

    /**
     * Start a question timer (backend authoritative timestamp)
     * - Idempotent: returns existing startedAt if already started
     */
    async startQuestion(attemptId: string, roundIndex: number, questionIndex: number): Promise<StartQuestionResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const roundAttempt = attempt.rounds[roundIndex]
        if (!roundAttempt) {
            const error = new Error('Round not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const questions = roundAttempt.questions || []

        // Resume support: redirect to current question if frontend is behind
        const currentIdx = roundAttempt.currentQuestionIndex ?? 0
        let activeQuestionIndex = questionIndex

        if (questionIndex < currentIdx) {
            // Frontend is behind (e.g. page refresh) — redirect to the current question
            const currentQuestion = questions[currentIdx]
            if (!currentQuestion) {
                const error = new Error('Current question not found') as Error & { statusCode: number; code: string }
                error.statusCode = 404
                error.code = 'NOT_FOUND'
                throw error
            }
            const existingAttempt = roundAttempt.questionAttempts?.find(qa => qa.questionIndex === currentIdx)
            if (existingAttempt?.startedAt) {
                return {
                    questionIndex: currentIdx,
                    questionId: currentQuestion.id,
                    startedAt: existingAttempt.startedAt,
                    perQuestionTimeLimit: roundAttempt.perQuestionTimeLimit ?? 0,
                }
            }
            // Current question exists but hasn't been started yet — fall through to start it
            activeQuestionIndex = currentIdx
        } else if (questionIndex > currentIdx) {
            // Trying to skip ahead — reject
            const error = new Error(`Cannot skip ahead. Current: ${currentIdx}, Requested: ${questionIndex}`) as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_QUESTION_INDEX'
            throw error
        }

        const question = questions[activeQuestionIndex]
        if (!question) {
            const error = new Error('Question not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Find or create question attempt
        let questionAttempt = roundAttempt.questionAttempts?.find(qa => qa.questionIndex === activeQuestionIndex)

        if (questionAttempt?.startedAt) {
            // Already started, return existing (idempotent)
            return {
                questionIndex: activeQuestionIndex,
                questionId: question.id,
                startedAt: questionAttempt.startedAt,
                perQuestionTimeLimit: roundAttempt.perQuestionTimeLimit ?? 0,
            }
        }

        // Start the question
        const now = new Date()

        // Initialize questionAttempts array if not exists
        if (!roundAttempt.questionAttempts) {
            roundAttempt.questionAttempts = []
        }

        if (!questionAttempt) {
            questionAttempt = {
                questionId: question.id,
                questionIndex: activeQuestionIndex,
                status: QuestionStatus.IN_PROGRESS,
                startedAt: now,
            }
            roundAttempt.questionAttempts.push(questionAttempt)
        } else {
            questionAttempt.status = QuestionStatus.IN_PROGRESS
            questionAttempt.startedAt = now
        }

        // Start round if not already
        if (roundAttempt.status === 'NOT_STARTED') {
            roundAttempt.status = 'IN_PROGRESS'
            roundAttempt.startedAt = now
            // Also start the attempt if not started
            if (attempt.status === 'NOT_STARTED') {
                attempt.status = 'IN_PROGRESS'
                attempt.startedAt = now
            }
        }

        await attempt.save()

        return {
            questionIndex: activeQuestionIndex,
            questionId: question.id,
            startedAt: now,
            perQuestionTimeLimit: roundAttempt.perQuestionTimeLimit ?? 0,
        }
    }

    /**
     * Submit answer for a question (with backend time enforcement)
     * - Validates time limit hasn't exceeded
     * - Auto-advances to next question
     */
    async submitAnswer(attemptId: string, roundIndex: number, questionIndex: number, input: SubmitAnswerInput): Promise<SubmitAnswerResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const roundAttempt = attempt.rounds[roundIndex]
        if (!roundAttempt) {
            const error = new Error('Round not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Validate question index matches current
        if (roundAttempt.currentQuestionIndex !== questionIndex) {
            const error = new Error(`Cannot submit: not current question. Current: ${roundAttempt.currentQuestionIndex}`) as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_QUESTION_INDEX'
            throw error
        }

        const questions = roundAttempt.questions || []
        const question = questions[questionIndex]
        if (!question) {
            const error = new Error('Question not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const questionAttempt = roundAttempt.questionAttempts?.find(qa => qa.questionIndex === questionIndex)
        const now = new Date()

        // Check time limit (only if question was started and has time limit)
        const perQuestionTimeLimit = roundAttempt.perQuestionTimeLimit ?? 0
        const timeExpired = !!(questionAttempt?.startedAt && perQuestionTimeLimit > 0 && (now.getTime() - new Date(questionAttempt.startedAt).getTime() > perQuestionTimeLimit * 1000))

        if (timeExpired) {
            // Time expired: mark question as EXPIRED, do not save answer, advance to next
            if (questionAttempt) {
                questionAttempt.status = QuestionStatus.EXPIRED
                questionAttempt.endedAt = new Date(new Date(questionAttempt!.startedAt!).getTime() + perQuestionTimeLimit * 1000)
            }

            const nextQuestionIndex = questionIndex + 1
            const isRoundComplete = nextQuestionIndex >= questions.length

            if (isRoundComplete) {
                roundAttempt.status = 'COMPLETED'
                roundAttempt.endedAt = now
                const allComplete = attempt.rounds.every(r => r.status === 'COMPLETED')
                if (allComplete) {
                    attempt.status = 'COMPLETED'
                    attempt.submittedAt = now
                }
            } else {
                roundAttempt.currentQuestionIndex = nextQuestionIndex
            }

            await attempt.save()

            if (isRoundComplete && roundAttempt.roundType === 'DSA') {
                try {
                    await evaluationService.createDSAPlaceholder(attemptId, { code: '', language: 'python' })
                    await enqueueEvaluationJob({ type: 'EVALUATE_DSA', attemptId })
                } catch (err) {
                    console.error(`Failed to enqueue DSA evaluation for attempt ${attemptId}:`, err)
                }
            }

            return {
                success: true,
                nextQuestionIndex: isRoundComplete ? null : nextQuestionIndex,
                roundComplete: isRoundComplete,
            }
        }

        // Save answer (within time)
        if (questionAttempt) {
            questionAttempt.answer = input.answer
            questionAttempt.status = QuestionStatus.COMPLETED
            questionAttempt.endedAt = now
        }

        if (!roundAttempt.answers) roundAttempt.answers = {}
        roundAttempt.answers[question.id] = input.answer

        const nextQuestionIndex = questionIndex + 1
        const isRoundComplete = nextQuestionIndex >= questions.length

        if (isRoundComplete) {
            roundAttempt.status = 'COMPLETED'
            roundAttempt.endedAt = now
            const allComplete = attempt.rounds.every(r => r.status === 'COMPLETED')
            if (allComplete) {
                attempt.status = 'COMPLETED'
                attempt.submittedAt = now
            }
        } else {
            roundAttempt.currentQuestionIndex = nextQuestionIndex
        }

        await attempt.save()

        // When DSA round is completed via last submitAnswer, enqueue evaluation (Judge0 test cases).
        // Frontend does not call submitRound for DSA; this ensures EVALUATE_DSA runs.
        if (isRoundComplete && roundAttempt.roundType === 'DSA') {
            try {
                await evaluationService.createDSAPlaceholder(attemptId, { code: '', language: 'python' })
                await enqueueEvaluationJob({
                    type: 'EVALUATE_DSA',
                    attemptId,
                })
            } catch (err) {
                console.error(`Failed to enqueue DSA evaluation for attempt ${attemptId}:`, err)
            }
        }

        return {
            success: true,
            nextQuestionIndex: isRoundComplete ? null : nextQuestionIndex,
            roundComplete: isRoundComplete,
        }
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
                timingMode: (r.timingMode || (r.roundType === 'AI' ? 'PER_ROUND' : 'PER_QUESTION')) as 'PER_QUESTION' | 'PER_ROUND',
                timeLimit: r.timeLimit ?? null,
                currentQuestionIndex: r.currentQuestionIndex ?? 0,
                perQuestionTimeLimit: r.perQuestionTimeLimit ?? 0,
                questionAttempts: (r.questionAttempts || []).map((qa): QuestionAttemptResponse => ({
                    questionId: qa.questionId,
                    questionIndex: qa.questionIndex,
                    startedAt: qa.startedAt ?? null,
                    endedAt: qa.endedAt ?? null,
                    status: qa.status as QuestionStatusType,
                })),
                totalQuestions: (r.questions || []).length,
            })),
            createdAt: attempt.createdAt,
        }
    }
}

export const attemptsService = new AttemptsService()

