import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { aiIntelligenceController } from './ai-intelligence.controller.js'

const router = Router()
router.use(authGuard)

// Ranking
router.post('/rank/:jobId', (req, res, next) => aiIntelligenceController.triggerRanking(req, res, next))
router.get('/rank/:jobId', (req, res, next) => aiIntelligenceController.getRanking(req, res, next))

// Matching
router.post('/match/candidate/:candidateId', (req, res, next) => aiIntelligenceController.matchCandidateToJobs(req, res, next))
router.post('/match/job/:jobId', (req, res, next) => aiIntelligenceController.matchJobToCandidates(req, res, next))

// Skill Gaps & Fit
router.get('/skill-gaps/:candidateId/:jobId', (req, res, next) => aiIntelligenceController.getSkillGaps(req, res, next))
router.get('/fit/:candidateId/:jobId', (req, res, next) => aiIntelligenceController.getFitExplanation(req, res, next))

// Outreach
router.post('/outreach/draft', (req, res, next) => aiIntelligenceController.generateOutreach(req, res, next))

// Pipeline Intelligence
router.get('/bottlenecks', (req, res, next) => aiIntelligenceController.getBottlenecks(req, res, next))
router.get('/optimizations', (req, res, next) => aiIntelligenceController.getOptimizations(req, res, next))
router.get('/forecast/:jobId', (req, res, next) => aiIntelligenceController.getForecast(req, res, next))

export const aiIntelligenceRoutes = router
