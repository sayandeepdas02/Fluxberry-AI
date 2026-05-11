import { Router } from 'express'
import { analyticsController } from './analytics.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)

router.get('/kpis', (req, res, next) => analyticsController.getKPIs(req, res, next))
router.get('/trends', (req, res, next) => analyticsController.getTrends(req, res, next))
router.get('/demographics', (req, res, next) => analyticsController.getDemographics(req, res, next))
router.get('/funnel', (req, res, next) => analyticsController.getFunnel(req, res, next))
router.get('/time-to-hire', (req, res, next) => analyticsController.getTimeToHire(req, res, next))
router.get('/onboarding', (req, res, next) => analyticsController.getOnboardingMetrics(req, res, next))
router.get('/ats-efficiency',         (req, res, next) => analyticsController.getAtsEfficiency(req, res, next))

// Phase 3 — Advanced analytics
router.get('/hiring-velocity',        (req, res, next) => analyticsController.getHiringVelocity(req, res, next))
router.get('/source-quality',         (req, res, next) => analyticsController.getSourceQuality(req, res, next))
router.get('/stage-dropoff',          (req, res, next) => analyticsController.getStageDropoff(req, res, next))
router.get('/recruiter-performance',  (req, res, next) => analyticsController.getRecruiterPerformance(req, res, next))

export default router
