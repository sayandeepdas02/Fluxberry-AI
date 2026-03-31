import { JobApplication, Candidate, AuditLog } from '../../database/models/index.js'
import { ScreeningResult, ScreeningStatus, deriveStatusPriority } from './models/screening-result.model.js'
import { JobScreeningProfile } from './models/job-screening-profile.model.js'
import { ResumeProfile } from './models/resume-profile.model.js'
import { RecruiterFeedback, FeedbackLabel } from './models/recruiter-feedback.model.js'
import { analyzeFeedback } from './scoring-v2/feedback-adjuster.js'

// ─────────────────────────────────────────────
// V2 Default Weights
// ─────────────────────────────────────────────

const DEFAULT_V2_WEIGHTS = {
    skillWeight:      0.35,
    experienceWeight: 0.30,
    projectWeight:    0.20,
    educationWeight:  0.10,
    bonusWeight:      0.05,
}

export class AtsScreeningService {
    async getJobScreeningStats(jobId: string, orgId: string) {
        // 1. Get total applicants and breakdown
        const allApplications = await JobApplication.countDocuments({ jobId, organizationId: orgId })
        const results = await ScreeningResult.find({ jobId, organizationId: orgId }).select('status finalScore')

        let totalApplicants = allApplications
        let autoShortlisted = 0
        let needsReview = 0
        let rejected = 0
        let parseFailed = 0
        // Applications where no ScreeningResult exists yet
        let screeningInProgress = totalApplicants - results.length

        // Histogram brackets (only scored/passed candidates)
        const scores = results.filter(r => r.status === ScreeningStatus.PASSED || r.status === 'SCORED').map(r => r.finalScore || 0)

        for (const res of results) {
            const isScored = res.status === ScreeningStatus.PASSED || res.status === 'SCORED'
            const isFailed = res.status === ScreeningStatus.FAILED_GATE

            if (isScored) {
                if ((res.finalScore || 0) >= 80) {
                    autoShortlisted++
                } else if ((res.finalScore || 0) >= 60) {
                    needsReview++
                } else {
                    rejected++
                }
            } else if (isFailed) {
                rejected++
            } else if (res.status === ScreeningStatus.PARSE_FAILED || res.status === ScreeningStatus.ERROR) {
                parseFailed++
            } else {
                // AWAITING_PARSE, SCORING_IN_PROGRESS, PENDING
                screeningInProgress++
            }
        }

        // Build 10-point histogram bins (0-9, 10-19… 90-100)
        const bins = Array(10).fill(0)
        for (const score of scores) {
            const binIndex = score === 100 ? 9 : Math.floor(score / 10)
            bins[binIndex]++
        }

        const histogram = bins.map((count, i) => ({
            range: `${i * 10}-${i * 10 + 9}`,
            count
        }))

        scores.sort((a, b) => a - b)
        const computePercentile = (p: number) => {
            if (scores.length === 0) return 0
            const index = Math.ceil((p / 100) * scores.length) - 1
            return scores[Math.max(0, index)]
        }

        return {
            overview: {
                totalApplicants,
                autoShortlisted,
                needsReview,
                rejected,
                screeningInProgress: Math.max(0, screeningInProgress),
                parseFailed,
            },
            histogram,
            percentiles: {
                p50: computePercentile(50),
                p75: computePercentile(75),
                p90: computePercentile(90)
            },
            avgScore: scores.length > 0
                ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
                : 0,
        }
    }

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
        const skip = (page - 1) * limit

        // ── Build dynamic query ──────────────────────────────────────
        const query: any = { jobId, organizationId: orgId }

        // Score range filter
        if (filters?.scoreMin != null || filters?.scoreMax != null) {
            query.finalScore = {}
            if (filters?.scoreMin != null) query.finalScore.$gte = filters.scoreMin
            if (filters?.scoreMax != null) query.finalScore.$lte = filters.scoreMax
        }

        // Decision filter (maps UI decision to status/score conditions)
        if (filters?.decision) {
            switch (filters.decision) {
                case 'SHORTLISTED':
                    // Manually overridden as SHORTLISTED, or auto-shortlisted (score >= 80)
                    query.$or = [
                        { 'manualOverride.decision': 'SHORTLISTED' },
                        {
                            status: { $in: [ScreeningStatus.PASSED, 'SCORED'] },
                            finalScore: { $gte: 80 },
                            'manualOverride.decision': { $exists: false },
                        },
                    ]
                    break
                case 'REVIEW':
                    query.$or = [
                        { 'manualOverride.decision': 'REVIEW' },
                        {
                            status: { $in: [ScreeningStatus.PASSED, 'SCORED'] },
                            finalScore: { $gte: 60, $lt: 80 },
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
                            finalScore: { $lt: 60 },
                            'manualOverride.decision': { $exists: false },
                        },
                    ]
                    break
                case 'PARSE_FAILED':
                    query.status = { $in: [ScreeningStatus.PARSE_FAILED, ScreeningStatus.ERROR] }
                    break
            }
        }

        // ── Name search: requires $lookup on Candidate collection ────
        let results: any[]
        let total: number

        if (filters?.search && filters.search.trim().length > 0) {
            const searchRegex = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

            // Use aggregation to join with Candidate and filter by name
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

            // Count total before pagination
            const countResult = await ScreeningResult.aggregate([...pipeline, { $count: 'total' }])
            total = countResult[0]?.total || 0

            // Paginate + sort
            results = await ScreeningResult.aggregate([
                ...pipeline,
                { $sort: { statusPriority: 1, finalScore: -1 } },
                { $skip: skip },
                { $limit: limit },
            ])

            // Map aggregation result to match .populate() shape
            results = results.map(r => ({
                ...r,
                candidateId: r._candidate,
            }))
        } else {
            // Standard query (faster path — no aggregation)
            results = await ScreeningResult.find(query)
                .sort({ statusPriority: 1, finalScore: -1 })
                .skip(skip)
                .limit(limit)
                .populate('candidateId', 'firstName lastName email')

            total = await ScreeningResult.countDocuments(query)
        }

        // Compute top-10 candidate IDs for badge display
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

            // Derive decision for UI
            let decision: string = 'PENDING'
            if (res.manualOverride?.decision) {
                decision = res.manualOverride.decision
            } else if (res.status === ScreeningStatus.PASSED || res.status === 'SCORED') {
                if ((res.finalScore || 0) >= 80) decision = 'SHORTLISTED'
                else if ((res.finalScore || 0) >= 60) decision = 'REVIEW'
                else decision = 'REJECTED'
            } else if (res.status === ScreeningStatus.FAILED_GATE) {
                decision = 'REJECTED'
            } else if (res.status === ScreeningStatus.PARSE_FAILED) {
                decision = 'PARSE_FAILED'
            } else if (res.status === ScreeningStatus.ERROR) {
                decision = 'ERROR'
            } else if (res.status === ScreeningStatus.AWAITING_PARSE || res.status === ScreeningStatus.SCORING_IN_PROGRESS) {
                decision = 'PENDING'
            }

            // Fallback for legacy documents without statusPriority
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
                // Override metadata (for tooltip)
                overrideReason: res.manualOverride?.reason || null,
                overrideAt:     res.manualOverride?.updatedAt || null,
                // Mini breakdown for score tooltip
                scoreBreakdown: res.scoreBreakdown ? {
                    skillScore:      res.scoreBreakdown.skillScore || 0,
                    experienceScore: res.scoreBreakdown.experienceScore || 0,
                    projectScore:    res.scoreBreakdown.projectScore || 0,
                    educationScore:  res.scoreBreakdown.educationScore || 0,
                } : null,
            }
        })

        return {
            data: candidates,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    }

    async getCandidateBreakdown(jobId: string, candidateId: string, orgId: string) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw { code: 'NOT_FOUND', message: 'Result not found' }

        const jobProfile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })

        const isV2 = result.scoringVersion === '2.0.0'

        const radarMap = [
            { subject: 'Skills',     A: result.scoreBreakdown?.skillScore      || 0, fullMark: 100 },
            { subject: 'Experience', A: result.scoreBreakdown?.experienceScore || 0, fullMark: 100 },
            { subject: 'Projects',   A: result.scoreBreakdown?.projectScore    || 0, fullMark: 100 },
            { subject: 'Education',  A: result.scoreBreakdown?.educationScore  || 0, fullMark: 100 },
            { subject: isV2 ? 'Signal Boost' : 'Bonus',
              A: isV2
                  ? (result.scoreBreakdown?.signalBoostScore || result.scoreBreakdown?.bonusScore || 0)
                  : (result.scoreBreakdown?.bonusScore || 0),
              fullMark: 100 },
        ]

        // ── Part 2: Rule-Based Explanation Generator ──
        const explanation = this.generateExplanation(result)

        return {
            radarData:              radarMap,
            hardGateFailureReason:  result.hardGateFailureReason,
            status:                 result.status,
            errorReason:            result.errorReason ?? null,
            finalScore:             result.finalScore,
            confidenceScore:        result.confidenceScore,
            scoringVersion:         result.scoringVersion,
            weights:                jobProfile?.weights,
            explanation,
            // Override metadata
            manualOverride: result.manualOverride ? {
                decision:  result.manualOverride.decision,
                reason:    result.manualOverride.reason,
                updatedAt: result.manualOverride.updatedAt,
            } : null,
            // V2-specific metadata
            ...(isV2 && {
                insights:          (result as any).insights || result.scoreBreakdown?.insights || [],
                skillMatchDetails: (result as any).skillMatchDetails || result.scoreBreakdown?.skillMatchDetails || [],
                signalBoostScore:  result.scoreBreakdown?.signalBoostScore || 0,
            }),
        }
    }

    // ─────────────────────────────────────────────
    // Part 2: Rule-Based Explanation Generator
    // ─────────────────────────────────────────────

    private generateExplanation(result: any): { strengths: string[]; weaknesses: string[]; summary: string } {
        const strengths: string[] = []
        const weaknesses: string[] = []

        const skill = result.scoreBreakdown?.skillScore ?? 0
        const exp   = result.scoreBreakdown?.experienceScore ?? 0
        const proj  = result.scoreBreakdown?.projectScore ?? 0
        const edu   = result.scoreBreakdown?.educationScore ?? 0

        // ── Strengths (score ≥ 70) ──
        if (skill >= 80) strengths.push('Strong alignment with required technical skills')
        else if (skill >= 70) strengths.push('Good match with required skills')

        if (exp >= 80) strengths.push('Experience level exceeds job requirements')
        else if (exp >= 70) strengths.push('Solid relevant experience')

        if (proj >= 85) strengths.push('Projects highly relevant to job responsibilities')
        else if (proj >= 70) strengths.push('Good project portfolio alignment')

        if (edu >= 85) strengths.push('Education exceeds or matches requirements')
        else if (edu >= 70) strengths.push('Meets education requirements')

        // ── Weaknesses (score < 50) ──
        if (skill < 40) weaknesses.push('Significant skill gaps for this role')
        else if (skill < 60) weaknesses.push('Some required skills not demonstrated')

        if (exp < 40) weaknesses.push('Experience below minimum requirement')
        else if (exp < 60) weaknesses.push('Experience slightly below job requirements')

        if (proj < 30) weaknesses.push('No relevant project work demonstrated')
        else if (proj < 50) weaknesses.push('Projects show limited relevance to the role')

        if (edu < 50 && edu > 0) weaknesses.push('Education level below recommended')

        // Hard gate failure
        if (result.status === ScreeningStatus.FAILED_GATE && result.hardGateFailureReason) {
            weaknesses.push(`Hard gate: ${result.hardGateFailureReason}`)
        }

        // ── Summary ──
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

    // ─────────────────────────────────────────────
    // Part 1: Weights Configuration
    // ─────────────────────────────────────────────

    async getWeights(jobId: string, orgId: string) {
        const profile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })
        const weights = profile?.weights || DEFAULT_V2_WEIGHTS

        return {
            skills:      weights.skillWeight,
            experience:  weights.experienceWeight,
            projects:    weights.projectWeight,
            education:   weights.educationWeight,
            signalBoost: weights.bonusWeight,
        }
    }

    async updateWeights(
        jobId: string,
        orgId: string,
        weights: { skills: number; experience: number; projects: number; education: number; signalBoost: number }
    ) {
        // Validation
        const values = [weights.skills, weights.experience, weights.projects, weights.education, weights.signalBoost]

        for (const v of values) {
            if (typeof v !== 'number' || v < 0 || v > 1) {
                throw { code: 'VALIDATION', message: `Each weight must be between 0 and 1. Got: ${v}` }
            }
        }

        const total = values.reduce((sum, v) => sum + v, 0)
        if (Math.abs(total - 1.0) > 0.01) {
            throw { code: 'VALIDATION', message: `Weights must sum to 1.0. Current sum: ${total.toFixed(2)}` }
        }

        const updated = await JobScreeningProfile.findOneAndUpdate(
            { jobId, organizationId: orgId },
            {
                $set: {
                    'weights.skillWeight':      weights.skills,
                    'weights.experienceWeight':  weights.experience,
                    'weights.projectWeight':     weights.projects,
                    'weights.educationWeight':   weights.education,
                    'weights.bonusWeight':       weights.signalBoost,
                },
            },
            { new: true, upsert: true }
        )

        return {
            skills:      updated.weights.skillWeight,
            experience:  updated.weights.experienceWeight,
            projects:    updated.weights.projectWeight,
            education:   updated.weights.educationWeight,
            signalBoost: updated.weights.bonusWeight,
        }
    }

    // ─────────────────────────────────────────────
    // Existing: Job Profile
    // ─────────────────────────────────────────────

    async getJobProfile(jobId: string, orgId: string) {
        let profile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })

        if (!profile) {
            profile = await JobScreeningProfile.create({
                jobId,
                organizationId: orgId,
                hardGates: {},
                weights:   DEFAULT_V2_WEIGHTS,
                thresholds: {
                    shortlist:   80,
                    reviewZone:  60,
                    autoReject:  0,
                }
            })
        }

        return profile
    }

    async updateJobProfile(jobId: string, orgId: string, data: any) {
        const profile = await JobScreeningProfile.findOneAndUpdate(
            { jobId, organizationId: orgId },
            { $set: data },
            { new: true, upsert: true }
        )
        return profile
    }

    // ─────────────────────────────────────────────
    // Part 4 + 5: Override with Feedback Capture
    // ─────────────────────────────────────────────

    async overrideDecision(
        jobId: string,
        candidateId: string,
        orgId: string,
        userId: string,
        newDecision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        reason: string
    ) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw { code: 'NOT_FOUND', message: 'Result not found' }

        let oldDecision = 'PENDING'
        if (result.manualOverride?.decision) {
            oldDecision = result.manualOverride.decision
        } else if (result.status === ScreeningStatus.PASSED || result.status === 'SCORED') {
            oldDecision = (result.finalScore || 0) >= 80 ? 'SHORTLISTED' : ((result.finalScore || 0) >= 60 ? 'REVIEW' : 'REJECTED')
        }

        // Part 4: Store full override metadata
        result.manualOverride = {
            decision: newDecision,
            reason,
            updatedBy: userId as any,
            updatedAt: new Date(),
        }
        await result.save()

        // Part 5: Auto-capture feedback signal
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

    // ─────────────────────────────────────────────
    // Part 5: Feedback Signal Capture
    // ─────────────────────────────────────────────

    private async captureFeedbackSignal(
        jobId: string,
        candidateId: string,
        orgId: string,
        userId: string,
        action: 'SHORTLISTED' | 'REVIEW' | 'REJECTED',
        result: any
    ) {
        // Map action to feedback label
        let label: FeedbackLabel
        if (action === 'SHORTLISTED') {
            label = 'POSITIVE'
        } else if (action === 'REJECTED') {
            label = 'NEGATIVE'
        } else {
            // REVIEW doesn't generate a signal (ambiguous)
            return
        }

        // Get candidate skills from resume profile
        let candidateSkills: string[] = []
        try {
            const resume = await ResumeProfile.findOne({ candidateId, organizationId: orgId })
            candidateSkills = resume?.parsedData?.skills || []
        } catch { /* non-critical */ }

        // Upsert feedback (prevents duplicates via unique index)
        try {
            await RecruiterFeedback.findOneAndUpdate(
                { jobId, candidateId, action },
                {
                    $set: {
                        organizationId: orgId,
                        label,
                        candidateSkills,
                        candidateScore: result.finalScore || 0,
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
            console.error('[ATS] Failed to capture feedback signal:', err)
            // Non-critical — don't fail the override
        }
    }

    // ─────────────────────────────────────────────
    // Part 5: Feedback Summary
    // ─────────────────────────────────────────────

    async getFeedbackSummary(jobId: string, orgId: string) {
        const profile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })
        return analyzeFeedback(jobId, orgId, profile?.weights)
    }
}

export const atsScreeningService = new AtsScreeningService()
