import { Router } from 'express'
import { dashboardController } from './dashboard.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

router.use(authGuard)

router.get('/summary', (req, res, next) =>
    dashboardController.getSummary(req, res, next)
)

router.get('/analytics', (req, res, next) =>
    dashboardController.getAnalytics(req, res, next)
)

export default router
