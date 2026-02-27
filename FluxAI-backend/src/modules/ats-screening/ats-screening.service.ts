import { JobApplication, Candidate, AuditLog } from '../../database/models/index.js'
import { ScreeningResult } from './models/screening-result.model.js'
import { JobScreeningProfile } from './models/job-screening-profile.model.js'

export class AtsScreeningService {
    async getJobScreeningStats(jobId: string, orgId: string) {
        // 1. Get total applicants and breakdown
        const allApplications = await JobApplication.countDocuments({ jobId, organizationId: orgId })
        const results = await ScreeningResult.find({ jobId, organizationId: orgId }).select('status finalScore')

        let totalApplicants = allApplications
        let autoShortlisted = 0
        let needsReview = 0
        let rejected = 0
        let screeningInProgress = totalApplicants - results.length // Applications where score not yet computed

        // Histogram brackets
        const scores = results.filter(r => r.status === 'PASSED').map(r => r.finalScore || 0)

        // Populate counts
        for (const res of results) {
            if (res.status === 'PASSED') {
                if ((res.finalScore || 0) >= 80) {
                    autoShortlisted++
                } else if ((res.finalScore || 0) >= 60) {
                    needsReview++
                } else {
                    rejected++
                }
            } else if (res.status === 'FAILED_GATE') {
                rejected++
            } else {
                screeningInProgress++
            }
        }

        // Build 10-point histogram bins
        const bins = Array(10).fill(0) // bins for 0-9, 10-19... 90-100
        for (const score of scores) {
            const binIndex = score === 100 ? 9 : Math.floor(score / 10)
            bins[binIndex]++
        }

        const histogram = bins.map((count, i) => ({
            range: `${i * 10}-${i * 10 + 9}`,
            count
        }))

        // Overall percentiles could be calculated based on sorted array `scores`
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
                screeningInProgress: Math.max(0, screeningInProgress)
            },
            histogram,
            percentiles: {
                p50: computePercentile(50),
                p75: computePercentile(75),
                p90: computePercentile(90)
            }
        }
    }

    async getCandidatesList(jobId: string, orgId: string, page: number, limit: number) {
        // Find screening results ordered by score
        const skip = (page - 1) * limit
        const sort: any = { status: 1, finalScore: -1 } // PENDING -> PASSED -> FAILED_GATE, sorted cleanly could be improved.
        // Actually want: Pending -> Highest score first

        const results = await ScreeningResult.find({ jobId, organizationId: orgId })
            .sort({ finalScore: -1, status: 1 })
            .skip(skip)
            .limit(limit)
            .populate('candidateId', 'firstName lastName email')

        const total = await ScreeningResult.countDocuments({ jobId, organizationId: orgId })

        const candidates = results.map((res: any) => {
            const candidate = res.candidateId

            // Map decision mapping logically
            let decision = 'PENDING'
            if (res.manualOverride?.decision) {
                decision = res.manualOverride.decision
            } else if (res.status === 'PASSED') {
                if (res.finalScore >= 80) decision = 'SHORTLISTED'
                else if (res.finalScore >= 60) decision = 'REVIEW'
                else decision = 'REJECTED'
            } else if (res.status === 'FAILED_GATE') {
                decision = 'REJECTED'
            } else if (res.status === 'ERROR') {
                decision = 'ERROR'
            }

            return {
                id: candidate._id,
                name: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email,
                score: res.finalScore || 0,
                confidence: res.confidenceScore || 0,
                decision,
                status: res.status,
                isOverridden: !!res.manualOverride
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

        // Format radar chart data mapping
        const radarMap = [
            { subject: 'Skills', A: result.scoreBreakdown?.skillScore || 0, fullMark: 100 },
            { subject: 'Experience', A: result.scoreBreakdown?.experienceScore || 0, fullMark: 100 },
            { subject: 'Projects', A: result.scoreBreakdown?.projectScore || 0, fullMark: 100 },
            { subject: 'Education', A: result.scoreBreakdown?.educationScore || 0, fullMark: 100 },
            { subject: 'Bonus', A: result.scoreBreakdown?.bonusScore || 0, fullMark: 100 }
        ]

        return {
            radarData: radarMap,
            hardGateFailureReason: result.hardGateFailureReason,
            status: result.status,
            finalScore: result.finalScore,
            confidenceScore: result.confidenceScore,
            scoringVersion: result.scoringVersion,
            // Include weights just for contextual transparency mapping if UI wants it
            weights: jobProfile?.weights
        }
    }

    async getJobProfile(jobId: string, orgId: string) {
        let profile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })

        if (!profile) {
            // Lazy-init defaults if an explicit check is made before ATS runner triggers
            profile = await JobScreeningProfile.create({
                jobId,
                organizationId: orgId,
                hardGates: {},
                weights: {
                    skillWeight: 0.4,
                    experienceWeight: 0.3,
                    projectWeight: 0.1,
                    educationWeight: 0.1,
                    bonusWeight: 0.1,
                },
                thresholds: {
                    shortlist: 80,
                    reviewZone: 60,
                    autoReject: 0,
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

    async overrideDecision(jobId: string, candidateId: string, orgId: string, userId: string, newDecision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED', reason: string) {
        const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
        if (!result) throw { code: 'NOT_FOUND', message: 'Result not found' }

        // Compute old decision locally for audit
        let oldDecision = 'PENDING'
        if (result.manualOverride?.decision) {
            oldDecision = result.manualOverride.decision
        } else if (result.status === 'PASSED') {
            oldDecision = (result.finalScore || 0) >= 80 ? 'SHORTLISTED' : ((result.finalScore || 0) >= 60 ? 'REVIEW' : 'REJECTED')
        }

        result.manualOverride = {
            decision: newDecision,
            reason
        }
        await result.save()

        // Audit Logging
        await AuditLog.create({
            organizationId: orgId,
            entityType: 'SCREENING_RESULT',
            entityId: result._id,
            action: 'MANUAL_OVERRIDE',
            performedBy: userId,
            previousValue: { decision: oldDecision },
            newValue: { decision: newDecision, reason }
        })

        return result
    }
}

export const atsScreeningService = new AtsScreeningService()
