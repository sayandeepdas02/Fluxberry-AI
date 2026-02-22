import { Router } from 'express'
import { attemptsController } from './attempts.controller.js'
import { proctoringController } from '../proctoring/proctoring.controller.js'

const router = Router()

// Public routes for candidates (no auth required)
// Note: In production, you'd use invitation tokens for access control

// Ribbon callback (must be before /:attemptId so "ribbon-callback" is not treated as attemptId)
router.get('/ribbon-callback', (req, res, next) => attemptsController.ribbonCallback(req, res, next))

// Get attempt details
router.get('/:attemptId', (req, res, next) => attemptsController.getById(req, res, next))

// Round operations (legacy - round-level)
router.get('/:attemptId/rounds/:roundType/questions', (req, res, next) => attemptsController.getRoundQuestions(req, res, next))
router.post('/:attemptId/rounds/:roundType/start', (req, res, next) => attemptsController.startRound(req, res, next))
router.post('/:attemptId/rounds/:roundType/submit', (req, res, next) => attemptsController.submitRound(req, res, next))

// Per-question APIs (V1 - round index based)
router.get('/:attemptId/rounds/:roundIndex/current-question', (req, res, next) => attemptsController.getCurrentQuestion(req, res, next))
router.post('/:attemptId/rounds/:roundIndex/questions/:questionIndex/start', (req, res, next) => attemptsController.startQuestion(req, res, next))
router.post('/:attemptId/rounds/:roundIndex/questions/:questionIndex/submit', (req, res, next) => attemptsController.submitAnswer(req, res, next))

// Proctoring (nested under attempts)
router.post('/:attemptId/proctoring-events', (req, res, next) => proctoringController.logEvent(req, res, next))
router.get('/:attemptId/proctoring-summary', (req, res, next) => proctoringController.getSummary(req, res, next))

export default router

