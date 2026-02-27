import { Request, Response } from 'express'
import { atsScreeningService } from './ats-screening.service.js'

interface AuthRequest extends Request {
    user?: {
        _id: string
        organizationId: string
    }
}

export class AtsScreeningController {
    async getJobStats(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const stats = await atsScreeningService.getJobScreeningStats(jobId, orgId)
            res.json({ success: true, ...stats })
        } catch (error) {
            console.error('[AtsScreening] getJobStats error:', error)
            res.status(500).json({ success: false, error: 'Failed to fetch ATS screening stats' })
        }
    }

    async getCandidatesList(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20

            const result = await atsScreeningService.getCandidatesList(jobId, orgId, page, limit)
            res.json({ success: true, ...result })
        } catch (error: any) {
            console.error('[AtsScreening] getCandidatesList error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch tracking list' })
        }
    }

    async getCandidateBreakdown(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId, candidateId } = req.params

            const breakdown = await atsScreeningService.getCandidateBreakdown(jobId, candidateId, orgId)
            res.json({ success: true, breakdown })
        } catch (error: any) {
            console.error('[AtsScreening] getCandidateBreakdown error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch breakdown' })
        }
    }

    async getJobProfile(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const profile = await atsScreeningService.getJobProfile(jobId, orgId)
            res.json({ success: true, profile })
        } catch (error: any) {
            console.error('[AtsScreening] getJobProfile error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch job profile' })
        }
    }

    async updateJobProfile(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params
            const updateData = req.body

            const profile = await atsScreeningService.updateJobProfile(jobId, orgId, updateData)
            res.json({ success: true, profile })
        } catch (error: any) {
            console.error('[AtsScreening] updateJobProfile error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to update job profile' })
        }
    }

    async overrideDecision(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const userId = req.user!._id
            const { jobId, candidateId } = req.params
            const { decision, reason } = req.body

            if (!['SHORTLISTED', 'REVIEW', 'REJECTED'].includes(decision)) {
                return res.status(400).json({ success: false, error: 'Invalid decision' })
            }

            const result = await atsScreeningService.overrideDecision(jobId, candidateId, orgId, userId, decision, reason || 'Manual override')
            res.json({ success: true, result })
        } catch (error: any) {
            console.error('[AtsScreening] overrideDecision error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to override decision' })
        }
    }
}

export const atsScreeningController = new AtsScreeningController()
