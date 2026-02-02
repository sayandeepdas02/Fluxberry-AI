import {
    Assessment,
    AssessmentAttempt,
    Candidate,
    Evaluation,
    ProctoringEvent,
    RoundTypeValue,
    RoundStatusType,
    AttemptStatusType,
} from '../../database/models/index.js'
import {
    RoundResultResponse,
    CandidateResultSummary,
    AssessmentResultsResponse,
    AttemptResultResponse,
} from './results.types.js'

export class ResultsService {
    /**
     * Get all results for an assessment
     * Returns candidate list with scores and proctoring flags
     */
    async getAssessmentResults(
        assessmentId: string,
        organizationId: string
    ): Promise<AssessmentResultsResponse> {
        // Verify assessment belongs to org
        const assessment = await Assessment.findOne({ _id: assessmentId, organizationId })

        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Get all attempts
        const attempts = await AssessmentAttempt.find({ assessmentId })
            .sort({ createdAt: -1 })

        const results: CandidateResultSummary[] = []

        for (const attempt of attempts) {
            const candidate = await Candidate.findById(attempt.candidateId)
            const evaluations = await Evaluation.find({ attemptId: attempt._id })
            const eventCount = await ProctoringEvent.countDocuments({ attemptId: attempt._id })

            const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0)
            const maxScore = evaluations.reduce((sum, e) => sum + e.maxScore, 0)

            results.push({
                candidateId: attempt.candidateId.toString(),
                candidateEmail: candidate?.email ?? 'unknown',
                candidateName: candidate?.firstName && candidate?.lastName
                    ? `${candidate.firstName} ${candidate.lastName}`
                    : candidate?.firstName || null,
                attemptId: attempt._id.toString(),
                status: attempt.status as AttemptStatusType,
                totalScore,
                maxScore,
                percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                proctoringFlags: eventCount,
                startedAt: attempt.startedAt ?? null,
                submittedAt: attempt.submittedAt ?? null,
            })
        }

        return {
            assessmentId,
            assessmentTitle: assessment.title,
            totalCandidates: attempts.length,
            completedCount: attempts.filter((a) => a.status === 'COMPLETED').length,
            results,
        }
    }

    /**
     * Get detailed result for a single attempt
     */
    async getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const assessment = await Assessment.findById(attempt.assessmentId)
        const candidate = await Candidate.findById(attempt.candidateId)
        const evaluations = await Evaluation.find({ attemptId }).sort({ roundType: 1 })
        const events = await ProctoringEvent.find({ attemptId })

        // Build round results
        const rounds: RoundResultResponse[] = attempt.rounds.map((round) => {
            const evaluation = evaluations.find((e) => e.roundType === round.roundType)

            return {
                roundType: round.roundType as RoundTypeValue,
                status: round.status as RoundStatusType,
                score: evaluation?.score ?? null,
                maxScore: evaluation?.maxScore ?? null,
                percentage: evaluation && evaluation.maxScore > 0
                    ? Math.round((evaluation.score / evaluation.maxScore) * 100)
                    : null,
                evaluatedAt: evaluation?.evaluatedAt ?? null,
            }
        })

        // Build proctoring summary
        const bySeverity: Record<string, number> = {}
        const byType: Record<string, number> = {}

        for (const event of events) {
            bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
            byType[event.eventType] = (byType[event.eventType] || 0) + 1
        }

        const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0)
        const maxScore = evaluations.reduce((sum, e) => sum + e.maxScore, 0)

        return {
            attemptId: attempt._id.toString(),
            assessmentId: assessment?._id.toString() ?? '',
            assessmentTitle: assessment?.title ?? 'Unknown Assessment',
            candidateId: attempt.candidateId.toString(),
            candidateEmail: candidate?.email ?? 'unknown',
            candidateName: candidate?.firstName && candidate?.lastName
                ? `${candidate.firstName} ${candidate.lastName}`
                : candidate?.firstName || null,
            status: attempt.status as AttemptStatusType,
            totalScore,
            maxScore,
            percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
            rounds,
            proctoringSummary: {
                totalEvents: events.length,
                bySeverity,
                byType,
            },
            startedAt: attempt.startedAt ?? null,
            submittedAt: attempt.submittedAt ?? null,
        }
    }
}

export const resultsService = new ResultsService()
