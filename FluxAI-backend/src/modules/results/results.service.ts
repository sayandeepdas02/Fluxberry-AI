import prisma from '../../database/prisma.js'
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
        const assessment = await prisma.assessment.findFirst({
            where: { id: assessmentId, organizationId },
        })

        if (!assessment) {
            const error = new Error('Assessment not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Get all attempts with evaluations and proctoring counts
        const attempts = await prisma.assessmentAttempt.findMany({
            where: { assessmentId },
            include: {
                candidate: true,
                evaluations: true,
                _count: {
                    select: { events: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const results: CandidateResultSummary[] = attempts.map((attempt) => {
            const totalScore = attempt.evaluations.reduce((sum, e) => sum + e.score, 0)
            const maxScore = attempt.evaluations.reduce((sum, e) => sum + e.maxScore, 0)

            return {
                candidateId: attempt.candidateId,
                candidateEmail: attempt.candidate.email,
                candidateName: attempt.candidate.firstName && attempt.candidate.lastName
                    ? `${attempt.candidate.firstName} ${attempt.candidate.lastName}`
                    : attempt.candidate.firstName || null,
                attemptId: attempt.id,
                status: attempt.status,
                totalScore,
                maxScore,
                percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                proctoringFlags: attempt._count.events,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
            }
        })

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
        const attempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                assessment: { select: { id: true, title: true } },
                candidate: true,
                rounds: { orderBy: { roundType: 'asc' } },
                evaluations: { orderBy: { roundType: 'asc' } },
                events: true,
            },
        })

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Build round results
        const rounds: RoundResultResponse[] = attempt.rounds.map((round) => {
            const evaluation = attempt.evaluations.find((e) => e.roundType === round.roundType)

            return {
                roundType: round.roundType,
                status: round.status,
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

        for (const event of attempt.events) {
            bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
            byType[event.eventType] = (byType[event.eventType] || 0) + 1
        }

        const totalScore = attempt.evaluations.reduce((sum, e) => sum + e.score, 0)
        const maxScore = attempt.evaluations.reduce((sum, e) => sum + e.maxScore, 0)

        return {
            attemptId: attempt.id,
            assessmentId: attempt.assessment.id,
            assessmentTitle: attempt.assessment.title,
            candidateId: attempt.candidateId,
            candidateEmail: attempt.candidate.email,
            candidateName: attempt.candidate.firstName && attempt.candidate.lastName
                ? `${attempt.candidate.firstName} ${attempt.candidate.lastName}`
                : attempt.candidate.firstName || null,
            status: attempt.status,
            totalScore,
            maxScore,
            percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
            rounds,
            proctoringSummary: {
                totalEvents: attempt.events.length,
                bySeverity,
                byType,
            },
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
        }
    }
}

export const resultsService = new ResultsService()
