import { Types } from 'mongoose'
import { Candidate, JobApplication, StageHistory, Job } from '../../database/models/index.js'

class CandidatePortalService {
    // Note: In a real system, authentication for this portal would use a secure token
    // sent to the candidate's email, not the standard recruiter JWT.
    // For this implementation, we assume the controller validates the candidate token.

    async getDashboard(candidateId: string, orgId: string) {
        const candidate = await Candidate.findOne({ _id: candidateId, organizationId: new Types.ObjectId(orgId) })
            .select('firstName lastName email phone socialProfiles tags')
            .lean()
        if (!candidate) throw { code: 'NOT_FOUND', message: 'Candidate not found' }

        const applications = await JobApplication.find({ candidateId: new Types.ObjectId(candidateId), organizationId: new Types.ObjectId(orgId) })
            .populate('jobId', 'title department location')
            .sort({ updatedAt: -1 })
            .lean()

        // Hide internal stages from candidate
        const publicApps = applications.map(app => {
            let publicStatus = app.status
            if (['SCREENING', 'REVIEW'].includes(app.status)) publicStatus = 'UNDER_REVIEW'

            return {
                _id: app._id,
                job: app.jobId,
                status: publicStatus,
                appliedAt: app.createdAt,
                lastUpdate: app.updatedAt,
            }
        })

        return {
            profile: candidate,
            applications: publicApps,
        }
    }

    async getApplicationTimeline(applicationId: string, candidateId: string, orgId: string) {
        const application = await JobApplication.findOne({
            _id: applicationId,
            candidateId: new Types.ObjectId(candidateId),
            organizationId: new Types.ObjectId(orgId)
        }).populate('jobId', 'title').lean()

        if (!application) throw { code: 'NOT_FOUND', message: 'Application not found' }

        const history = await StageHistory.find({
            applicationId: new Types.ObjectId(applicationId),
            organizationId: new Types.ObjectId(orgId)
        }).sort({ createdAt: 1 }).lean()

        const timeline = history.map(h => {
            let label = `Moved to ${h.toStage}`
            if (h.toStage === 'APPLIED') label = 'Application Submitted'
            if (h.toStage === 'SCREENING') label = 'Application Under Review'
            if (h.toStage === 'INTERVIEW') label = 'Invited to Interview'
            if (h.toStage === 'OFFER_SENT') label = 'Offer Extended'
            if (h.toStage === 'HIRED') label = 'Welcome to the team!'
            if (h.toStage === 'REJECTED') label = 'Application Declined'

            return {
                stage: h.toStage,
                label,
                date: h.createdAt,
            }
        })

        // Filter out internal-only stage transitions if needed, but for now map them to friendly labels
        return {
            job: application.jobId,
            currentStatus: application.status,
            timeline,
        }
    }

    async getInterviewPrepKit(applicationId: string, candidateId: string, orgId: string) {
        // In a full implementation, this would link to scheduled Interview models.
        // For Phase 3, we generate a dynamic prep kit based on the job description.
        const application = await JobApplication.findOne({
            _id: applicationId,
            candidateId: new Types.ObjectId(candidateId),
            organizationId: new Types.ObjectId(orgId)
        }).populate('jobId').lean()

        if (!application || !application.jobId) throw { code: 'NOT_FOUND', message: 'Application or Job not found' }

        const job: any = application.jobId

        // AI Guidance (Deterministic Fallback)
        let aiTips = [
            `Review your experience with ${job.requiredSkills?.[0] || 'core technologies'}.`,
            `Be prepared to discuss your past projects related to ${job.department || 'this role'}.`,
            `Think about examples where you demonstrated leadership and problem-solving.`,
        ]

        try {
            // Attempt to get real AI tips if OpenAI is configured
            const { aiResumeAnalysisService } = await import('../../ai/intelligence/ai-resume-analysis.service.js')
            const gaps = await aiResumeAnalysisService.analyzeSkillGaps(candidateId, job._id.toString(), orgId)
            
            if (gaps.gaps && gaps.gaps.length > 0) {
                const missing = gaps.gaps.filter(g => g.status === 'missing').map(g => g.skill)
                if (missing.length > 0) {
                    aiTips = [
                        `We noticed you might not have direct experience with ${missing[0]}. Be prepared to discuss how you learn new skills quickly.`,
                        ...aiTips.slice(0, 2)
                    ]
                }
            }
        } catch {
            // Use fallback
        }

        return {
            jobTitle: job.title,
            department: job.department,
            aboutTheRole: job.description?.substring(0, 300) + '...',
            keySkills: job.requiredSkills,
            prepTips: aiTips,
            whatToExpect: [
                'Initial Recruiter Screen (30 mins)',
                'Technical/Role-Specific Interview (60 mins)',
                'Team Fit & Culture (45 mins)',
            ]
        }
    }
}

export const candidatePortalService = new CandidatePortalService()
