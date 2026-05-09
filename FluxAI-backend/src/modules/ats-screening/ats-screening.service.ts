/**
 * ATS Screening Service — FACADE
 *
 * This file is the public API used by ats-screening.controller.ts.
 * All logic has been delegated to focused sub-services:
 *
 *   - statsService    → stats.service.ts    (aggregation pipeline stats)
 *   - scoringService  → scoring.service.ts  (weights & config management)
 *   - decisionService → decision.service.ts (candidates list, overrides, feedback)
 *
 * @since P0 Refactor (single source of truth)
 */

import { statsService }    from './stats.service.js'
import { scoringService }  from './scoring.service.js'
import { decisionService } from './decision.service.js'
import { copilotService }  from './copilot.service.js'
import { ScreeningResult, ScreeningStatus, deriveStatusPriority } from './models/screening-result.model.js'
import { enqueueResumeParsingJob } from '../../jobs/queues/index.js'
import { Candidate } from '../../database/models/index.js'
import { AppError } from '../../common/errors/index.js'

export class AtsScreeningService {
    // ─────────────────────────────────────────────
    // Stats
    // ─────────────────────────────────────────────

    async getJobScreeningStats(jobId: string, orgId: string) {
        return statsService.getJobScreeningStats(jobId, orgId)
    }

    // ─────────────────────────────────────────────
    // Candidate List & Breakdown
    // ─────────────────────────────────────────────

    async getCandidatesList(
        jobId: string,
        orgId: string,
        page = 1,
        limit = 20,
        filters?: {
            search?: string
            decision?: string
            scoreMin?: number
            scoreMax?: number
        }
    ) {
        return decisionService.getCandidatesList(jobId, orgId, page, limit, filters)
    }

    async getCandidateBreakdown(jobId: string, candidateId: string, orgId: string) {
        return decisionService.getCandidateBreakdown(jobId, candidateId, orgId)
    }

    // ─────────────────────────────────────────────
    // Overrides
    // ─────────────────────────────────────────────

    async overrideDecision(
        jobId: string,
        candidateId: string,
        orgId: string,
        userId: string,
        newDecision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason: string
    ) {
        return decisionService.overrideDecision(jobId, candidateId, orgId, userId, newDecision, reason)
    }

    async bulkOverride(
        jobId: string,
        orgId: string,
        userId: string,
        candidateIds: string[],
        decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason: string
    ) {
        return decisionService.bulkOverride(jobId, orgId, userId, candidateIds, decision, reason)
    }

    // ─────────────────────────────────────────────
    // Parse Retry
    // ─────────────────────────────────────────────

    async retryParseFailed(jobId: string, candidateId: string, orgId: string) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw AppError.notFound('Screening result')

        if (
            result.status !== ScreeningStatus.PARSE_FAILED &&
            result.status !== ScreeningStatus.ERROR
        ) {
            throw AppError.badRequest(`Cannot retry a result with status: ${result.status}`)
        }

        const candidate = await Candidate.findById(candidateId)
        if (!candidate?.resumeUrl) {
            throw AppError.badRequest('Candidate has no resume URL to parse')
        }

        // Reset status so it can be re-processed
        await ScreeningResult.findOneAndUpdate(
            { candidateId, jobId, organizationId: orgId },
            {
                $set: {
                    status:         ScreeningStatus.AWAITING_PARSE,
                    statusPriority: deriveStatusPriority(ScreeningStatus.AWAITING_PARSE),
                    errorReason:    null,
                    updatedAt:      new Date(),
                }
            }
        )

        await enqueueResumeParsingJob({ candidateId, organizationId: orgId, resumeUrl: candidate.resumeUrl })
        return { queued: true, candidateId }
    }

    // ─────────────────────────────────────────────
    // Job Profile (Legacy API — backward compat)
    // ─────────────────────────────────────────────

    /** @deprecated Use job.scoringConfig directly */
    async getJobProfile(jobId: string, orgId: string) {
        return scoringService.getJobProfile(jobId, orgId)
    }

    /** @deprecated Use jobs.service.ts update() with scoringConfig field */
    async updateJobProfile(jobId: string, orgId: string, data: Record<string, unknown>) {
        return scoringService.updateJobProfile(jobId, orgId, data)
    }

    // ─────────────────────────────────────────────
    // Weights — now reads/writes from Job.scoringConfig
    // ─────────────────────────────────────────────

    async getWeights(jobId: string, orgId: string) {
        return scoringService.getWeights(jobId, orgId)
    }

    async updateWeights(
        jobId: string,
        orgId: string,
        weights: { skills: number; experience: number; projects: number; education: number; signalBoost: number },
        performedBy?: string
    ) {
        return scoringService.updateWeights(jobId, orgId, weights, performedBy)
    }

    // ─────────────────────────────────────────────
    // Feedback
    // ─────────────────────────────────────────────

    async getFeedbackSummary(jobId: string, orgId: string) {
        return decisionService.getFeedbackSummary(jobId, orgId)
    }

    async captureFeedbackSignal(
        jobId: string,
        candidateId: string,
        orgId: string,
        userId: string,
        action: 'SHORTLISTED' | 'REVIEW' | 'REJECTED'
    ) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw AppError.notFound('Screening result')
        return (decisionService as any).captureFeedbackSignal(jobId, candidateId, orgId, userId, action, result)
    }

    // ─────────────────────────────────────────────
    // AI Hiring Copilot
    // ─────────────────────────────────────────────

    async getCopilotInsights(jobId: string, orgId: string) {
        return copilotService.generateCopilotInsights(jobId, orgId)
    }

    async getCopilotCandidateSummary(jobId: string, candidateId: string, orgId: string) {
        return copilotService.getCandidateSummary(jobId, candidateId, orgId)
    }

    async generateInterviewQuestions(jobId: string, candidateId: string, orgId: string) {
        return copilotService.generateInterviewQuestions(jobId, candidateId, orgId)
    }

    async invalidateCopilotCache(jobId: string, candidateId?: string) {
        return copilotService.invalidateCache(jobId, candidateId)
    }
}

export const atsScreeningService = new AtsScreeningService()
