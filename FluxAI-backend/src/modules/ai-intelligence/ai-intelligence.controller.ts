import { Request, Response, NextFunction } from 'express'
import { aiRankingService } from '../../ai/intelligence/ai-ranking.service.js'
import { aiMatchingService } from '../../ai/intelligence/ai-matching.service.js'
import { aiPipelineService } from '../../ai/intelligence/ai-pipeline.service.js'
import { aiOutreachService } from '../../ai/intelligence/ai-outreach.service.js'
import { aiResumeAnalysisService } from '../../ai/intelligence/ai-resume-analysis.service.js'

class AIIntelligenceController {
    // ── Ranking ──────────────────────────────────────────────
    async triggerRanking(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiRankingService.rankCandidatesForJob(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getRanking(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiRankingService.getRankingResults(req.params.jobId, orgId)
            if (!result) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No ranking found' } })
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Matching ─────────────────────────────────────────────
    async matchCandidateToJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiMatchingService.matchCandidateToJobs(req.params.candidateId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async matchJobToCandidates(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiMatchingService.matchJobToCandidates(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Skill Gaps & Fit ─────────────────────────────────────
    async getSkillGaps(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiResumeAnalysisService.analyzeSkillGaps(req.params.candidateId, req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getFitExplanation(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiResumeAnalysisService.generateFitExplanation(req.params.candidateId, req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    // ── Outreach ─────────────────────────────────────────────
    async generateOutreach(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const { prospectId, jobId, tone } = req.body
            const draft = await aiOutreachService.generateOutreachDraft(prospectId, jobId, orgId, tone)
            res.json({ success: true, data: draft })
        } catch (err) { next(err) }
    }

    // ── Pipeline Intelligence ────────────────────────────────
    async getBottlenecks(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const jobId = req.query.jobId as string | undefined
            const result = await aiPipelineService.detectBottlenecks(orgId, jobId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getOptimizations(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiPipelineService.suggestOptimizations(orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }

    async getForecast(req: Request, res: Response, next: NextFunction) {
        try {
            const orgId = (req as any).organizationId
            const result = await aiPipelineService.forecastHiringTimeline(req.params.jobId, orgId)
            res.json({ success: true, data: result })
        } catch (err) { next(err) }
    }
}

export const aiIntelligenceController = new AIIntelligenceController()
