import { Router } from 'express'
import { analyticsController } from './analytics.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)

router.get('/kpis', (req, res, next) => analyticsController.getKPIs(req, res, next))
router.get('/trends', (req, res, next) => analyticsController.getTrends(req, res, next))
router.get('/demographics', (req, res, next) => analyticsController.getDemographics(req, res, next))

export default router
