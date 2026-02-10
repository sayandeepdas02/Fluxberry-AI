/**
 * AI Interview Routes — V2 (Async Recording + Processing)
 */

import { Router } from 'express'
import { aiInterviewController } from './ai-interview.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'

const router = Router()

// ─── Candidate-facing routes (no auth — candidate uses attempt token) ───

// Start session + get questions
router.post('/:attemptId/ai/start', aiInterviewController.startSession.bind(aiInterviewController))

// End session
router.post('/:attemptId/ai/end', aiInterviewController.endSession.bind(aiInterviewController))

// Upload flow
router.post('/:attemptId/ai/upload/init', aiInterviewController.initUpload.bind(aiInterviewController))
router.post('/:attemptId/ai/upload/complete', aiInterviewController.completeUpload.bind(aiInterviewController))

// Complete session (after all uploads)
router.post('/:attemptId/ai/complete', aiInterviewController.completeSession.bind(aiInterviewController))

// Session details (legacy compat)
router.get('/:attemptId/ai/details', aiInterviewController.getSessionDetails.bind(aiInterviewController))

// ─── Recruiter-facing routes (auth required) ───

// Full AI interview results
router.get('/:attemptId/ai/results', authGuard, aiInterviewController.getResults.bind(aiInterviewController))

// Signed video download URL for a specific question response
router.get('/:attemptId/ai/responses/:questionId/video', authGuard, aiInterviewController.getResponseVideo.bind(aiInterviewController))

export default router
