import { Router } from 'express'
import { atsScreeningController } from './ats-screening.controller.js'
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

export const atsScreeningRoutes = router
