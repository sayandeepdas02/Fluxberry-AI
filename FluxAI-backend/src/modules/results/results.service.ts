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
import { AppError } from '../../common/errors/index.js'
import {
    RoundResultResponse,
    CandidateResultSummary,
    AssessmentResultsResponse,
    AttemptResultResponse,
} from './results.types.js'

export class ResultsService {
    /**
     * Get all results for an assessment.
     * Batch-loads candidates, evaluations, and proctoring counts to prevent N+1.
     */
    async getAssessmentResults(
        assessmentId: string,
        organizationId: string
    ): Promise<AssessmentResultsResponse> {
        const assessment = await Assessment.findOne({ _id: assessmentId, organizationId })
        if (!assessment) throw AppError.notFound('Assessment')

        const attempts = await AssessmentAttempt.find({ assessmentId }).sort({ createdAt: -1 }).lean()

        if (attempts.length === 0) {
            return {
                assessmentId,
                assessmentTitle: assessment.title,
                totalCandidates: 0,
                completedCount: 0,
                results: [],
            }
        }

        // Batch-fetch all related data in parallel — no N+1
        const candidateIds = [...new Set(attempts.map(a => a.candidateId.toString()))]
        const attemptIds = attempts.map(a => a._id)

        const [candidates, allEvaluations, proctoringCounts] = await Promise.all([
            Candidate.find({ _id: { $in: candidateIds } })
                .select('firstName lastName email')
                .lean(),
            Evaluation.find({ attemptId: { $in: attemptIds } }).lean(),
            ProctoringEvent.aggregate([
                { $match: { attemptId: { $in: attemptIds } } },
                { $group: { _id: '$attemptId', count: { $sum: 1 } } },
            ]),
        ])

        // Build O(1) lookup maps
        const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]))
        const evaluationsByAttempt = new Map<string, typeof allEvaluations>()
        for (const ev of allEvaluations) {
            const key = ev.attemptId.toString()
            if (!evaluationsByAttempt.has(key)) evaluationsByAttempt.set(key, [])
            evaluationsByAttempt.get(key)!.push(ev)
        }
        const proctoringByAttempt = new Map<string, number>(
            proctoringCounts.map((p: any) => [p._id.toString(), p.count])
        )

        const results: CandidateResultSummary[] = attempts.map(attempt => {
            const candidate = candidateMap.get(attempt.candidateId.toString())
            const evaluations = evaluationsByAttempt.get(attempt._id.toString()) ?? []
            const eventCount = proctoringByAttempt.get(attempt._id.toString()) ?? 0

            const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0)
            const maxScore = evaluations.reduce((sum, e) => sum + e.maxScore, 0)

            return {
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
            }
        })

        return {
            assessmentId,
            assessmentTitle: assessment.title,
            totalCandidates: attempts.length,
            completedCount: attempts.filter(a => a.status === 'COMPLETED').length,
            results,
        }
    }

    /**
     * Get detailed result for a single attempt.
     * Parallel fetches to avoid sequential waterfall.
     */
    async getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
        const attempt = await AssessmentAttempt.findById(attemptId)
        if (!attempt) throw AppError.notFound('Attempt')

        // Parallel fetch — no waterfall
        const [assessment, candidate, evaluations, events] = await Promise.all([
            Assessment.findById(attempt.assessmentId).lean(),
            Candidate.findById(attempt.candidateId).select('email firstName lastName').lean(),
            Evaluation.find({ attemptId }).sort({ roundType: 1 }).lean(),
            ProctoringEvent.find({ attemptId }).lean(),
        ])

        const rounds: RoundResultResponse[] = attempt.rounds.map(round => {
            const evaluation = evaluations.find(e => e.roundType === round.roundType)
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
