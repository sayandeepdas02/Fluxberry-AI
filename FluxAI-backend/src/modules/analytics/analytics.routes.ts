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

export default router
