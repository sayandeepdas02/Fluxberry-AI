import { Request, Response } from 'express'
import { interviewService } from './interviews.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class InterviewController {
    async createInterview(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const interview = await interviewService.createInterview(organizationId!, req.body)
            res.status(201).json(interview)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async getInterviews(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const interviews = await interviewService.getInterviews(organizationId!, req.query)
            res.json(interviews)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async getInterview(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const interview = await interviewService.getInterview(id, organizationId!)
            if (!interview) return res.status(404).json({ message: 'Interview not found' })
            res.json(interview)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async updateInterview(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const interview = await interviewService.updateInterview(id, organizationId!, req.body)
            if (!interview) return res.status(404).json({ message: 'Interview not found' })
            res.json(interview)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async cancelInterview(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { id } = req.params
            const interview = await interviewService.cancelInterview(id, organizationId!)
            if (!interview) return res.status(404).json({ message: 'Interview not found' })
            res.json(interview)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async submitScorecard(req: Request, res: Response) {
        try {
            const { organizationId, id: userId } = (req as AuthenticatedRequest).user!
            const scorecard = await interviewService.submitScorecard(organizationId!, {
                ...req.body,
                interviewerId: userId
            })
            res.status(201).json(scorecard)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }

    async getScorecard(req: Request, res: Response) {
        try {
            const { organizationId } = (req as AuthenticatedRequest).user!
            const { interviewId } = req.params
            const scorecard = await interviewService.getScorecard(interviewId, organizationId!)
            if (!scorecard) return res.status(404).json({ message: 'Scorecard not found' })
            res.json(scorecard)
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
}

export const interviewController = new InterviewController()
