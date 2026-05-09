import { Response, NextFunction } from 'express'
import { interviewService } from './interviews.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class InterviewController {
    async createInterview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const interview = await interviewService.createInterview(organizationId!, req.body)
            res.success(interview, 201)
        } catch (error) {
            next(error)
        }
    }

    async getInterviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const interviews = await interviewService.getInterviews(organizationId!, req.query)
            res.success(interviews)
        } catch (error) {
            next(error)
        }
    }

    async getInterview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const interview = await interviewService.getInterview(req.params.id, organizationId!)
            if (!interview) throw AppError.notFound('Interview')
            res.success(interview)
        } catch (error) {
            next(error)
        }
    }

    async updateInterview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const interview = await interviewService.updateInterview(req.params.id, organizationId!, req.body)
            if (!interview) throw AppError.notFound('Interview')
            res.success(interview)
        } catch (error) {
            next(error)
        }
    }

    async cancelInterview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const interview = await interviewService.cancelInterview(req.params.id, organizationId!)
            if (!interview) throw AppError.notFound('Interview')
            res.success(interview)
        } catch (error) {
            next(error)
        }
    }

    async submitScorecard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId, id: userId } = req.user!
            const scorecard = await interviewService.submitScorecard(organizationId!, {
                ...req.body,
                interviewerId: userId,
            })
            res.success(scorecard, 201)
        } catch (error) {
            next(error)
        }
    }

    async getScorecard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            const scorecard = await interviewService.getScorecard(req.params.interviewId, organizationId!)
            if (!scorecard) throw AppError.notFound('Scorecard')
            res.success(scorecard)
        } catch (error) {
            next(error)
        }
    }
}

export const interviewController = new InterviewController()
