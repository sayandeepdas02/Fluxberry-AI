import { Router } from 'express'
import { atsScreeningController } from './ats-screening.controller.js'
import { copilotController } from './copilot.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// ── Stats & Candidates ──────────────────────────────────────
router.get(
    '/:jobId/stats',
    atsScreeningController.getJobStats
)

router.get(
    '/:jobId/candidates',
    atsScreeningController.getCandidatesList
)

router.get(
    '/:jobId/candidates/:candidateId/breakdown',
    atsScreeningController.getCandidateBreakdown
)

router.get(
    '/:jobId/compare',
    atsScreeningController.compareCandidates
)

// ── Overrides ────────────────────────────────────────────────
router.post(
    '/:jobId/candidates/:candidateId/override',
    atsScreeningController.overrideDecision
)

router.post(
    '/:jobId/candidates/bulk-override',
    atsScreeningController.bulkOverride
)

router.post(
    '/:jobId/candidates/:candidateId/retry-parse',
    atsScreeningController.retryParseFailed
)

// ── Job Profile & Settings ───────────────────────────────────
router.get(
    '/:jobId/profile',
    atsScreeningController.getJobProfile
)

router.put(
    '/:jobId/profile',
    atsScreeningController.updateJobProfile
)

// ── Part 1: Weights Configuration ────────────────────────────
router.get(
    '/:jobId/weights',
    atsScreeningController.getWeights
)

router.put(
    '/:jobId/weights',
    atsScreeningController.updateWeights
)

// ── Part 5: Feedback ─────────────────────────────────────────
router.get(
    '/:jobId/feedback-summary',
    atsScreeningController.getFeedbackSummary
)

// ── AI Hiring Copilot ────────────────────────────────────────
// Note: /copilot/candidate/:candidateId must come before /copilot
// to avoid ambiguous param matching.
router.get(
    '/:jobId/copilot/candidate/:candidateId',
    (req, res, next) => copilotController.getCandidateSummary(req as any, res, next)
)

router.get(
    '/:jobId/copilot',
    (req, res, next) => copilotController.getInsights(req as any, res, next)
)

router.post(
    '/:jobId/copilot/questions',
    (req, res, next) => copilotController.generateQuestions(req as any, res, next)
)

router.post(
    '/:jobId/copilot/chat',
    (req, res, next) => copilotController.chat(req as any, res, next)
)

export const atsScreeningRoutes = router
