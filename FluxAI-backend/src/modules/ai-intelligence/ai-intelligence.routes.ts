import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { aiIntelligenceController } from './ai-intelligence.controller.js'

const router = Router()
router.use(authGuard)

// ── Candidate Intelligence ─────────────────────────────────────
router.get('/candidates/:candidateId/insights',       (req, res, next) => aiIntelligenceController.getCandidateInsights(req, res, next))
router.post('/candidates/:candidateId/outreach-draft',(req, res, next) => aiIntelligenceController.generateOutreachDraft(req, res, next))
router.get('/candidates/:candidateId/skill-gap',      (req, res, next) => aiIntelligenceController.getSkillGap(req, res, next))

// ── Job Intelligence ───────────────────────────────────────────
router.get('/jobs/:jobId/ranked-candidates',          (req, res, next) => aiIntelligenceController.getRankedCandidates(req, res, next))
router.get('/jobs/:jobId/pipeline-optimizations',     (req, res, next) => aiIntelligenceController.getPipelineOptimizations(req, res, next))

// ── Org-Level Intelligence ─────────────────────────────────────
router.get('/hiring-bottlenecks',                     (req, res, next) => aiIntelligenceController.detectBottlenecks(req, res, next))

// ── Recruiter Copilot Chat ─────────────────────────────────────
router.post('/copilot/chat',                          (req, res, next) => aiIntelligenceController.copilotChat(req, res, next))

export default router
