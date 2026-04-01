import { Request, Response } from 'express'
import { copilotService } from './copilot.service.js'

interface AuthRequest extends Request {
    user?: { _id: string; organizationId: string }
}

export class CopilotController {
    /**
     * GET /ats/:jobId/copilot
     * Returns top recommendations + pool insights + suggested actions.
     * Backend caches 5 minutes in Redis.
     */
    async getInsights(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params
            const data = await copilotService.generateCopilotInsights(jobId, orgId)
            res.json({ success: true, data })
        } catch (error: any) {
            console.error('[Copilot] getInsights error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({
                success: false,
                error: error.message || 'Failed to generate Copilot insights',
            })
        }
    }

    /**
     * GET /ats/:jobId/copilot/candidate/:candidateId
     * Returns per-candidate AI summary for the breakdown modal.
     * Backend caches 10 minutes in Redis.
     */
    async getCandidateSummary(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId, candidateId } = req.params
            const data = await copilotService.getCandidateSummary(jobId, candidateId, orgId)
            res.json({ success: true, data })
        } catch (error: any) {
            console.error('[Copilot] getCandidateSummary error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({
                success: false,
                error: error.message || 'Failed to generate candidate summary',
            })
        }
    }

    /**
     * POST /ats/:jobId/copilot/questions
     * Body: { candidateId: string }
     * Returns 5 tailored interview questions. Not cached — fresh per request.
     */
    async generateQuestions(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params
            const { candidateId } = req.body

            if (!candidateId) {
                return res.status(400).json({ success: false, error: 'candidateId is required' })
            }

            const questions = await copilotService.generateInterviewQuestions(jobId, candidateId, orgId)
            res.json({ success: true, data: questions })
        } catch (error: any) {
            console.error('[Copilot] generateQuestions error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({
                success: false,
                error: error.message || 'Failed to generate interview questions',
            })
        }
    }
}

export const copilotController = new CopilotController()
