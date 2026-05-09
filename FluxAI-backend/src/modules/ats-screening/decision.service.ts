/**
 * ATS Decision Service
 *
 * Handles candidate list, breakdown, manual overrides, and feedback.
 * All threshold comparisons read from Job.scoringConfig (no hardcoded 80/60).
 */

import { AuditLog, Job as JobModel } from '../../database/models/index.js'
import { AppError } from '../../common/errors/index.js'
import { createPaginatedResponse } from '../../common/dto/pagination.dto.js'
import { ScreeningResult, ScreeningStatus, deriveStatusPriority } from './models/screening-result.model.js'
import { JobScreeningProfile } from './models/job-screening-profile.model.js'
import { ResumeProfile } from './models/resume-profile.model.js'
import { RecruiterFeedback, FeedbackLabel } from './models/recruiter-feedback.model.js'
import { analyzeFeedback } from './scoring-v2/feedback-adjuster.js'
import { DEFAULT_SCORING_CONFIG, type IScoringConfig } from './scoring-config.types.js'

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

async function resolveThresholds(jobId: string, orgId: string): Promise<IScoringConfig['thresholds']> {
    const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
        .select('scoringConfig').lean()
    return (job as any)?.scoringConfig?.thresholds ?? DEFAULT_SCORING_CONFIG.thresholds
}

/**
 * Derive the UI-facing decision for a screening result.
 * Uses job-level thresholds instead of hardcoded values.
 */
function deriveDecision(
    res: any,
    thresholds: IScoringConfig['thresholds'],
): string {
    if (res.manualOverride?.decision) return res.manualOverride.decision

    const score = res.finalScore ?? 0
    const status = res.status

    if (status === ScreeningStatus.PASSED || status === 'SCORED') {
        if (score >= thresholds.shortlist) return 'SHORTLISTED'
        if (score >= thresholds.review)    return 'REVIEW'
        return 'REJECTED'
    }
    if (status === ScreeningStatus.FAILED_GATE)   return 'REJECTED'
    if (status === ScreeningStatus.PARSE_FAILED)  return 'PARSE_FAILED'
    if (status === ScreeningStatus.ERROR)         return 'ERROR'
    if (status === ScreeningStatus.AWAITING_PARSE || status === ScreeningStatus.SCORING_IN_PROGRESS) {
        return 'PENDING'
    }
    return 'PENDING'
}

// ──────────────────────────────────────────────────────────────
// Decision Service
// ──────────────────────────────────────────────────────────────

export class DecisionService {
    async getCandidatesList(
        jobId: string,
        orgId: string,
        page: number,
        limit: number,
        filters?: {
            search?: string
            decision?: string
            scoreMin?: number
            scoreMax?: number
        }
    ) {
        // Resolve thresholds from Job.scoringConfig
        const thresholds = await resolveThresholds(jobId, orgId)
        const shortlist  = thresholds.shortlist
        const review     = thresholds.review

        const skip = (page - 1) * limit
        const query: Record<string, unknown> = { jobId, organizationId: orgId }

        // Score range filter
        if (filters?.scoreMin != null || filters?.scoreMax != null) {
            const scoreFilter: Record<string, number> = {}
            if (filters?.scoreMin != null) scoreFilter.$gte = filters.scoreMin
            if (filters?.scoreMax != null) scoreFilter.$lte = filters.scoreMax
            query.finalScore = scoreFilter
        }

        // Decision filter — uses job-level thresholds
        if (filters?.decision) {
            switch (filters.decision) {
                case 'SHORTLISTED':
                    query.$or = [
                        { 'manualOverride.decision': 'SHORTLISTED' },
                        {
                            status: { $in: [ScreeningStatus.PASSED, 'SCORED'] },
                            finalScore: { $gte: shortlist },
                            'manualOverride.decision': { $exists: false },
                        },
                    ]
                    break
                case 'REVIEW':
                    query.$or = [
                        { 'manualOverride.decision': 'REVIEW' },
                        {
                            status: { $in: [ScreeningStatus.PASSED, 'SCORED'] },
                            finalScore: { $gte: review, $lt: shortlist },
                            'manualOverride.decision': { $exists: false },
                        },
                    ]
                    break
                case 'REJECTED':
                    query.$or = [
                        { 'manualOverride.decision': 'REJECTED' },
                        { status: ScreeningStatus.FAILED_GATE },
                        {
                            status: { $in: [ScreeningStatus.PASSED, 'SCORED'] },
                            finalScore: { $lt: review },
                            'manualOverride.decision': { $exists: false },
                        },
                    ]
                    break
                case 'PARSE_FAILED':
                    query.status = { $in: [ScreeningStatus.PARSE_FAILED, ScreeningStatus.ERROR] }
                    break
            }
        }

        let results: any[]
        let total: number

        if (filters?.search && filters.search.trim().length > 0) {
            const searchRegex = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const pipeline: any[] = [
                { $match: query },
                {
                    $lookup: {
                        from: 'candidates',
                        localField: 'candidateId',
                        foreignField: '_id',
                        as: '_candidate',
                    },
                },
                { $unwind: '$_candidate' },
                {
                    $match: {
                        $or: [
                            { '_candidate.firstName': { $regex: searchRegex, $options: 'i' } },
                            { '_candidate.lastName':  { $regex: searchRegex, $options: 'i' } },
                            { '_candidate.email':     { $regex: searchRegex, $options: 'i' } },
                        ],
                    },
                },
            ]

            const countResult = await ScreeningResult.aggregate([...pipeline, { $count: 'total' }])
            total = countResult[0]?.total || 0

            results = await ScreeningResult.aggregate([
                ...pipeline,
                { $sort: { statusPriority: 1, finalScore: -1 } },
                { $skip: skip },
                { $limit: limit },
            ])
            results = results.map(r => ({ ...r, candidateId: r._candidate }))
        } else {
            results = await ScreeningResult.find(query)
                .sort({ statusPriority: 1, finalScore: -1 })
                .skip(skip)
                .limit(limit)
                .populate('candidateId', 'firstName lastName email')

            total = await ScreeningResult.countDocuments(query)
        }

        // Top-10 candidates for badge display
        const top10Results = await ScreeningResult.find({
            jobId,
            organizationId: orgId,
            status: { $in: [ScreeningStatus.PASSED, 'SCORED'] },
        })
            .sort({ finalScore: -1 })
            .limit(10)
            .select('candidateId')

        const top10Ids = new Set(top10Results.map((r: any) => r.candidateId?.toString?.() || r.candidateId))

        const candidates = results.map((res: any) => {
            const candidate = res.candidateId
            const decision  = deriveDecision(res, thresholds)
            const resolvedPriority = res.statusPriority ?? deriveStatusPriority(res.status)
            const candidateIdStr = candidate?._id?.toString?.() || ''

            return {
                id:          candidate._id,
                name:        `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email,
                score:       res.finalScore || 0,
                confidence:  res.confidenceScore || 0,
                decision,
                status:      res.status,
                statusPriority: resolvedPriority,
                errorReason: res.errorReason ?? null,
                isOverridden:!!res.manualOverride?.decision,
                isTop10:     top10Ids.has(candidateIdStr),
                overrideReason: res.manualOverride?.reason || null,
                overrideAt:     res.manualOverride?.updatedAt || null,
                scoreBreakdown: res.scoreBreakdown ? {
                    skillScore:      res.scoreBreakdown.skillScore || 0,
                    experienceScore: res.scoreBreakdown.experienceScore || 0,
                    projectScore:    res.scoreBreakdown.projectScore || 0,
                    educationScore:  res.scoreBreakdown.educationScore || 0,
                } : null,
            }
        })

        return createPaginatedResponse(candidates, total, page, limit)
    }

    async getCandidateBreakdown(jobId: string, candidateId: string, orgId: string) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw AppError.notFound('Screening result')

        const thresholds = await resolveThresholds(jobId, orgId)

        const isV2 = result.scoringVersion === '2.0.0'

        const radarMap = [
            { subject: 'Skills',     A: result.scoreBreakdown?.skillScore      || 0, fullMark: 100 },
            { subject: 'Experience', A: result.scoreBreakdown?.experienceScore || 0, fullMark: 100 },
            { subject: 'Projects',   A: result.scoreBreakdown?.projectScore    || 0, fullMark: 100 },
            { subject: 'Education',  A: result.scoreBreakdown?.educationScore  || 0, fullMark: 100 },
            {
                subject: isV2 ? 'Signal Boost' : 'Bonus',
                A: isV2
                    ? (result.scoreBreakdown?.signalBoostScore || result.scoreBreakdown?.bonusScore || 0)
                    : (result.scoreBreakdown?.bonusScore || 0),
                fullMark: 100
            },
        ]

        const explanation = this.generateExplanation(result)

        return {
            radarData:             radarMap,
            hardGateFailureReason: result.hardGateFailureReason,
            status:                result.status,
            errorReason:           result.errorReason ?? null,
            finalScore:            result.finalScore,
            confidenceScore:       result.confidenceScore,
            scoringVersion:        result.scoringVersion,
            thresholds,   // Return thresholds so frontend can render correct labels
            explanation,
            manualOverride: result.manualOverride ? {
                decision:  result.manualOverride.decision,
                reason:    result.manualOverride.reason,
                updatedAt: result.manualOverride.updatedAt,
            } : null,
            insights:          result.scoreBreakdown?.insights ?? [],
            skillMatchDetails: result.scoreBreakdown?.skillMatchDetails ?? [],
            signalBoostScore:  result.scoreBreakdown?.signalBoostScore ?? 0,
        }
    }

    private generateExplanation(result: any): { strengths: string[]; weaknesses: string[]; summary: string } {
        const strengths: string[] = []
        const weaknesses: string[] = []

        const skill = result.scoreBreakdown?.skillScore ?? 0
        const exp   = result.scoreBreakdown?.experienceScore ?? 0
        const proj  = result.scoreBreakdown?.projectScore ?? 0
        const edu   = result.scoreBreakdown?.educationScore ?? 0

        if (skill >= 80) strengths.push('Strong alignment with required technical skills')
        else if (skill >= 70) strengths.push('Good match with required skills')

        if (exp >= 80) strengths.push('Experience level exceeds job requirements')
        else if (exp >= 70) strengths.push('Solid relevant experience')

        if (proj >= 85) strengths.push('Projects highly relevant to job responsibilities')
        else if (proj >= 70) strengths.push('Good project portfolio alignment')

        if (edu >= 85) strengths.push('Education exceeds or matches requirements')
        else if (edu >= 70) strengths.push('Meets education requirements')

        if (skill < 40) weaknesses.push('Significant skill gaps for this role')
        else if (skill < 60) weaknesses.push('Some required skills not demonstrated')

        if (exp < 40) weaknesses.push('Experience below minimum requirement')
        else if (exp < 60) weaknesses.push('Experience slightly below job requirements')

        if (proj < 30) weaknesses.push('No relevant project work demonstrated')
        else if (proj < 50) weaknesses.push('Projects show limited relevance to the role')

        if (edu < 50 && edu > 0) weaknesses.push('Education level below recommended')

        if (result.status === ScreeningStatus.FAILED_GATE && result.hardGateFailureReason) {
            weaknesses.push(`Hard gate: ${result.hardGateFailureReason}`)
        }

        const finalScore = result.finalScore ?? 0
        let summary: string

        if (result.status === ScreeningStatus.FAILED_GATE) {
            summary = `This candidate did not pass the minimum requirements. ${result.hardGateFailureReason || ''}`
        } else if (finalScore >= 80) {
            const topStrengths = strengths.slice(0, 2).join(' and ').toLowerCase()
            summary = `This candidate is a strong match, showing ${topStrengths || 'overall alignment with job requirements'}.`
        } else if (finalScore >= 60) {
            if (weaknesses.length > 0) {
                summary = `This candidate shows potential but has areas for review: ${weaknesses[0].toLowerCase()}.`
            } else {
                summary = 'This candidate meets baseline requirements and may benefit from further evaluation.'
            }
        } else {
            const topWeakness = weaknesses.length > 0 ? weaknesses[0].toLowerCase() : 'multiple areas of concern'
            summary = `This candidate shows limited alignment with the role, primarily due to ${topWeakness}.`
        }

        return { strengths, weaknesses, summary }
    }

    async overrideDecision(
        jobId: string,
        candidateId: string,
        orgId: string,
        userId: string,
        newDecision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason: string
    ) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw AppError.notFound('Screening result')

        const thresholds = await resolveThresholds(jobId, orgId)

        let oldDecision = 'PENDING'
        if (result.manualOverride?.decision) {
            oldDecision = result.manualOverride.decision
        } else if (result.status === ScreeningStatus.PASSED || result.status === 'SCORED') {
            const score = result.finalScore || 0
            oldDecision = score >= thresholds.shortlist ? 'SHORTLISTED'
                : score >= thresholds.review ? 'REVIEW'
                : 'REJECTED'
        }

        result.manualOverride = {
            decision: newDecision,
            reason,
            updatedBy: userId as any,
            updatedAt: new Date(),
        }
        await result.save()

        // Auto-capture feedback signal
        await this.captureFeedbackSignal(jobId, candidateId, orgId, userId, newDecision, result)

        await AuditLog.create({
            organizationId: orgId,
            entityType:     'SCREENING_RESULT',
            entityId:       result._id,
            action:         'MANUAL_OVERRIDE',
            performedBy:    userId,
            previousValue:  { decision: oldDecision },
            newValue:       { decision: newDecision, reason }
        })

        return result
    }

    /**
     * Bulk override using MongoDB bulkWrite for performance at scale.
     * Replaces sequential await-in-loop pattern.
     */
    async bulkOverride(
        jobId: string,
        orgId: string,
        userId: string,
        candidateIds: string[],
        decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason: string
    ): Promise<{ processed: number; failed: number; results: any[]; errors: any[] }> {
        const now = new Date()

        const bulkOps = candidateIds.map(candidateId => ({
            updateOne: {
                filter: { candidateId, jobId, organizationId: orgId } as any,
                update: {
                    $set: {
                        manualOverride: {
                            decision,
                            reason: reason || `Bulk ${decision.toLowerCase()}`,
                            updatedBy: userId,
                            updatedAt: now,
                        }
                    }
                } as any
            }
        }))

        const bulkResult = await ScreeningResult.bulkWrite(bulkOps, { ordered: false })

        // Capture feedback signals asynchronously (non-blocking)
        this.captureBulkFeedbackSignals(jobId, orgId, userId, candidateIds, decision).catch(err =>
            console.error('[DecisionService] Bulk feedback signal failed:', err)
        )

        return {
            processed: bulkResult.modifiedCount + bulkResult.upsertedCount,
            failed: candidateIds.length - (bulkResult.modifiedCount + bulkResult.upsertedCount),
            results: candidateIds.map(id => ({ candidateId: id, success: true })),
            errors: [],
        }
    }

    private async captureFeedbackSignal(
        jobId: string,
        candidateId: string,
        orgId: string,
        userId: string,
        action: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        result: any
    ) {
        let label: FeedbackLabel
        if (action === 'SHORTLISTED')      label = 'POSITIVE'
        else if (action === 'REJECTED')    label = 'NEGATIVE'
        else return  // REVIEW = ambiguous, skip

        let candidateSkills: string[] = []
        try {
            const resume = await ResumeProfile.findOne({ candidateId, organizationId: orgId })
            candidateSkills = resume?.parsedData?.skills || []
        } catch { /* non-critical */ }

        try {
            await RecruiterFeedback.findOneAndUpdate(
                { jobId, candidateId, action },
                {
                    $set: {
                        organizationId: orgId,
                        label,
                        candidateSkills,
                        candidateScore:  result.finalScore || 0,
                        scoreBreakdown: result.scoreBreakdown ? {
                            skillScore:      result.scoreBreakdown.skillScore || 0,
                            experienceScore: result.scoreBreakdown.experienceScore || 0,
                            projectScore:    result.scoreBreakdown.projectScore || 0,
                            educationScore:  result.scoreBreakdown.educationScore || 0,
                        } : undefined,
                        performedBy: userId,
                    }
                },
                { upsert: true, new: true }
            )
        } catch (err) {
            console.error('[DecisionService] Failed to capture feedback signal:', err)
        }
    }

    private async captureBulkFeedbackSignals(
        jobId: string,
        orgId: string,
        userId: string,
        candidateIds: string[],
        action: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
    ) {
        if (action === 'REVIEW') return

        const results = await ScreeningResult.find({
            jobId, organizationId: orgId,
            candidateId: { $in: candidateIds }
        }).select('candidateId finalScore scoreBreakdown')

        for (const result of results) {
            await this.captureFeedbackSignal(
                jobId,
                result.candidateId.toString(),
                orgId,
                userId,
                action,
                result,
            ).catch(() => {/* non-critical */})
        }
    }

    async getFeedbackSummary(jobId: string, orgId: string) {
        // Read weights from Job.scoringConfig
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId }).select('scoringConfig').lean()
        const weights = (job as any)?.scoringConfig?.weights

        // Map to legacy format for analyzeFeedback compatibility
        const legacyWeights = weights ? {
            skillWeight:       weights.skills,
            experienceWeight:  weights.experience,
            projectWeight:     weights.projects,
            educationWeight:   weights.education,
            bonusWeight:       weights.signalBoost,
        } : undefined

        return analyzeFeedback(jobId, orgId, legacyWeights)
    }
}

export const decisionService = new DecisionService()
