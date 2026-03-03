/**
 * AI Interview Routes — V2 (Async Recording + Processing) + Orchestrator
 */

import { Router } from 'express'
import { aiInterviewController } from './ai-interview.controller.js'
import { authGuard } from '../../common/guards/auth.guard.js'
import { createRoomToken } from './services/livekit.service.js'
import { AIInterviewSession } from '../../database/models/index.js'

const router = Router()

// ─── Candidate-facing routes (no auth — candidate uses attempt token) ───

// Start session + get questions (legacy recording flow)
router.post('/:attemptId/ai/start', aiInterviewController.startSession.bind(aiInterviewController))

// Start Ribbon interactive voice interview (returns interview_link; sets cookie for callback)
router.post('/:attemptId/ai/ribbon/start', aiInterviewController.startRibbonSession.bind(aiInterviewController))

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

// ─── Orchestrator routes (LLM state machine — auth required) ───

// Create a new orchestrator session
router.post('/orchestrator/sessions', authGuard, aiInterviewController.createOrchestratorSession.bind(aiInterviewController))

// Submit a candidate turn (answer) and get the next AI question
router.post('/orchestrator/sessions/:sessionId/turn', authGuard, aiInterviewController.submitOrchestratorTurn.bind(aiInterviewController))

// Get current session state (reconnection / polling)
router.get('/orchestrator/sessions/:sessionId', authGuard, aiInterviewController.getOrchestratorSession.bind(aiInterviewController))

// Manually complete a session (timeout / candidate disconnect)
router.post('/orchestrator/sessions/:sessionId/complete', authGuard, aiInterviewController.completeOrchestratorSession.bind(aiInterviewController))

// LiveKit room token — candidates call this to connect to the LiveKit room
router.post('/orchestrator/sessions/:sessionId/livekit-token', async (req, res) => {
    try {
        const { sessionId } = req.params
        const session = await AIInterviewSession.findById(sessionId).lean()
        if (!session) return res.status(404).json({ success: false, error: { message: 'Session not found' } })
        const identity = `candidate-${session.candidateId.toString()}-${sessionId.slice(-6)}`
        const tokenData = await createRoomToken(sessionId, identity)
        return res.json({ success: true, data: tokenData })
    } catch (err: any) {
        return res.status(err.statusCode ?? 500).json({ success: false, error: { message: err.message } })
    }
})

export default router

