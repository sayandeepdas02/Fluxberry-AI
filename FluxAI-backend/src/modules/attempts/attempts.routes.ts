import { Router } from 'express'
import { attemptsController } from './attempts.controller.js'
import { proctoringController } from '../proctoring/proctoring.controller.js'

const router = Router()

// Public routes for candidates (no auth required)
// Note: In production, you'd use invitation tokens for access control

// Get attempt details
router.get('/:attemptId', (req, res, next) => attemptsController.getById(req, res, next))

// Round operations
router.post('/:attemptId/rounds/:roundType/start', (req, res, next) => attemptsController.startRound(req, res, next))
router.post('/:attemptId/rounds/:roundType/submit', (req, res, next) => attemptsController.submitRound(req, res, next))

// Proctoring (nested under attempts)
router.post('/:attemptId/proctoring-events', (req, res, next) => proctoringController.logEvent(req, res, next))
router.get('/:attemptId/proctoring-summary', (req, res, next) => proctoringController.getSummary(req, res, next))

export default router
