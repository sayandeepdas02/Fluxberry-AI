import { Router } from 'express'
import { resultsController } from './results.controller.js'

const router = Router()

// Results routes - no auth guard needed for attempt result (candidate access)
router.get('/:attemptId/result', (req, res, next) => resultsController.getAttemptResult(req, res, next))

export default router
