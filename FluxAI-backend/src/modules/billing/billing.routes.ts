import { Router } from 'express'
import { billingController } from './billing.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// All billing routes require authentication
router.use(authGuard)

// GET /api/billing/status — fetch current plan, trial, and installed apps
router.get('/status', (req, res, next) => billingController.getStatus(req, res, next))

// POST /api/billing/apps/:appId/install
router.post('/apps/:appId/install', (req, res, next) => billingController.installApp(req, res, next))

// POST /api/billing/apps/:appId/uninstall
router.post('/apps/:appId/uninstall', (req, res, next) => billingController.uninstallApp(req, res, next))

export const billingRoutes = router
