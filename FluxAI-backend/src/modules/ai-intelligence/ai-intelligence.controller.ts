import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/types/request.types.js'
import { AppError } from '../../common/errors/index.js'
import { aiRankingService } from '../../ai/intelligence/ai-ranking.service.js'
import { aiMatchingService } from '../../ai/intelligence/ai-matching.service.js'
import { aiPipelineService } from '../../ai/intelligence/ai-pipeline.service.js'
import { aiOutreachService } from '../../ai/intelligence/ai-outreach.service.js'
import { aiResumeAnalysisService } from '../../ai/intelligence/ai-resume-analysis.service.js'

// Optional: import the main-branch service if it exists (lazy-loaded on first use)
let aiIntelligenceService: any = null
let _aiSvcInitialized = false
async function resolveAIIntelligenceService() {
    if (!_aiSvcInitialized) {
        try { aiIntelligenceService = (await import('./ai-intelligence.service.js')).aiIntelligenceService } catch {}
        _aiSvcInitialized = true
    }
    return aiIntelligenceService
}

export class AIIntelligenceController {

    // ── Candidate Insights (main branch service) ─────────────
    async getCandidateInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            if (!aiIntelligenceService) throw AppError.internal('AI Intelligence service not available')
            const insights = await aiIntelligenceService.getCandidateInsights(
                req.params.candidateId, orgId, req.query.jobId as string | undefined
            )
            res.success(insights)
        } catch (e) { next(e) }
    }

    // ── Outreach Draft (both versions) ───────────────────────
    async generateOutreachDraft(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { jobId } = req.body
            if (!jobId) throw AppError.badRequest('jobId is required')
            if (aiIntelligenceService) {
                const draft = await aiIntelligenceService.generateOutreachDraft(req.params.candidateId, orgId, jobId)
                return res.success(draft)
            }
            // Fallback to Phase 3 AI outreach service
            const draft = await aiOutreachService.generateOutreachDraft(req.params.candidateId, jobId, orgId)
            res.json({ success: true, data: draft })
        } catch (e) { next(e) }
    }

    // ── Ranking ──────────────────────────────────────────────
    async triggerRanking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiRankingService.rankCandidatesForJob(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getRanking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiRankingService.getRankingResults(req.params.jobId, orgId)
            if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No ranking found' } })
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getRankedCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            if (aiIntelligenceService) {
                const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
                const ranked = await aiIntelligenceService.getRankedCandidatesForJob(req.params.jobId, orgId, limit)
                return res.success(ranked)
            }
            const result = await aiRankingService.rankCandidatesForJob(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (e) { next(e) }
    }

    // ── Matching ─────────────────────────────────────────────
    async matchCandidateToJobs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiMatchingService.matchCandidateToJobs(req.params.candidateId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async matchJobToCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiMatchingService.matchJobToCandidates(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Skill Gaps & Fit ─────────────────────────────────────
    async getSkillGaps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiResumeAnalysisService.analyzeSkillGaps(req.params.candidateId, req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getSkillGap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { jobId } = req.query
            if (!jobId) throw AppError.badRequest('jobId query parameter required')
            if (aiIntelligenceService) {
                const analysis = await aiIntelligenceService.getSkillGapAnalysis(req.params.candidateId, jobId as string, orgId)
                return res.success(analysis)
            }
            const result = await aiResumeAnalysisService.analyzeSkillGaps(req.params.candidateId, jobId as string, orgId)
            res.json({ success: true, data: result })
        } catch (e) { next(e) }
    }

    async getFitExplanation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiResumeAnalysisService.generateFitExplanation(req.params.candidateId, req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Outreach (Phase 3) ───────────────────────────────────
    async generateOutreach(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const { prospectId, jobId, tone } = req.body
            const draft = await aiOutreachService.generateOutreachDraft(prospectId, jobId, orgId, tone)
            res.json({ success: true, data: draft })
        } catch (err) { next(err) }
    }

    // ── Pipeline Intelligence ────────────────────────────────
    async getBottlenecks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const jobId = req.query.jobId as string | undefined
            const result = await aiPipelineService.detectBottlenecks(orgId, jobId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async detectBottlenecks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            if (aiIntelligenceService) {
                const bottlenecks = await aiIntelligenceService.detectHiringBottlenecks(orgId)
                return res.success(bottlenecks)
            }
            const result = await aiPipelineService.detectBottlenecks(orgId)
            res.json({ success: true, data: result })
        } catch (e) { next(e) }
    }

    async getOptimizations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiPipelineService.suggestOptimizations(orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getForecast(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            const result = await aiPipelineService.forecastHiringTimeline(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getPipelineOptimizations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            if (aiIntelligenceService) {
                const result = await aiIntelligenceService.getPipelineOptimizations(req.params.jobId, orgId)
                return res.success(result)
            }
            const result = await aiPipelineService.suggestOptimizations(orgId)
            res.json({ success: true, data: result })
        } catch (e) { next(e) }
    }

    // ── Copilot Chat ─────────────────────────────────────────
    async copilotChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            await resolveAIIntelligenceService()
            const orgId = req.user?.organizationId
            if (!orgId) throw AppError.forbidden('Organization context required')
            if (!aiIntelligenceService) throw AppError.internal('Copilot service not available')
            const { messages, context } = req.body
            if (!Array.isArray(messages) || messages.length === 0)
                throw AppError.badRequest('messages array is required')
            const response = await aiIntelligenceService.recruiterCopilotChat(orgId, messages, context)
            res.success({ response })
        } catch (e) { next(e) }
    }
}

export const aiIntelligenceController = new AIIntelligenceController()
