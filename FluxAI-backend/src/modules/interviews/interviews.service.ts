import { Types } from 'mongoose'
import { Interview, IInterview, InterviewStatus } from '../../database/models/interview.models.js'
import { Scorecard, IScorecard } from '../../database/models/scorecard.models.js'
import { User, JobApplication } from '../../database/models/index.js'
import { createCalendarService } from '../../common/services/calendar.service.js'
import { fluxEvents, DomainEvent } from '../../common/services/events.service.js'

class InterviewService {
    async createInterview(organizationId: string, data: Partial<IInterview>): Promise<IInterview> {
        // 1. Check for availability (simple overlap check)
        const conflict = await Interview.findOne({
            interviewerId: data.interviewerId,
            status: InterviewStatus.SCHEDULED,
            $or: [
                { startTime: { $lt: data.endTime, $gte: data.startTime } },
                { endTime: { $gt: data.startTime, $lte: data.endTime } }
            ]
        })

        if (conflict) {
            throw new Error('Interviewer has a conflict at this time')
        }

        // 2. Create Interview
        const interview = await Interview.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
        })

        // 3. Sync with Google Calendar (if tokens exist)
        try {
            const user = await User.findById(data.interviewerId)
            if (user?.googleAccessToken && user?.googleRefreshToken) {
                const calendarService = createCalendarService()
                const tokens = {
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken
                }

                // Fetch candidate email
                const application = await JobApplication.findById(data.applicationId).populate('candidateId')
                const candidateEmail = (application?.candidateId as any)?.email

                const event = await calendarService.createEvent(tokens, {
                    summary: data.title || 'Interview',
                    description: data.description || '',
                    startTime: new Date(data.startTime!),
                    endTime: new Date(data.endTime!),
                    attendees: candidateEmail ? [candidateEmail] : []
                })

                if (event.id) {
                    interview.calendarEventId = event.id
                    await interview.save()
                }
            }
        } catch (error) {
            console.error('Failed to sync with Google Calendar', error)
            // Don't fail the request, just log
        }

        return interview
    }

    async getInterviews(organizationId: string, query: any): Promise<IInterview[]> {
        const filter: any = { organizationId: new Types.ObjectId(organizationId) }

        if (query.interviewerId) filter.interviewerId = new Types.ObjectId(query.interviewerId)
        if (query.candidateId) filter.candidateId = new Types.ObjectId(query.candidateId)
        if (query.status) filter.status = query.status
        if (query.date) {
            const startOfDay = new Date(query.date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(query.date)
            endOfDay.setHours(23, 59, 59, 999)
            filter.startTime = { $gte: startOfDay, $lte: endOfDay }
        }

        return Interview.find(filter)
            .populate('interviewerId', 'firstName lastName email')
            .populate('candidateId', 'firstName lastName email')
            .populate('jobId', 'title')
            .sort({ startTime: 1 })
            .lean()
    }

    async getInterview(id: string, organizationId: string): Promise<IInterview | null> {
        return Interview.findOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
            .populate('interviewerId', 'firstName lastName email')
            .populate('candidateId', 'firstName lastName email')
            .populate('scorecardId')
    }

    async updateInterview(id: string, organizationId: string, data: Partial<IInterview>): Promise<IInterview | null> {
        return Interview.findOneAndUpdate(
            { _id: id, organizationId: new Types.ObjectId(organizationId) },
            { $set: data },
            { new: true }
        )
    }

    async cancelInterview(id: string, organizationId: string): Promise<IInterview | null> {
        return Interview.findOneAndUpdate(
            { _id: id, organizationId: new Types.ObjectId(organizationId) },
            { $set: { status: InterviewStatus.CANCELLED } },
            { new: true }
        )
    }

    async submitScorecard(organizationId: string, data: Partial<IScorecard>): Promise<IScorecard> {
        // 1. Create Scorecard
        const scorecard = await Scorecard.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
            submittedAt: new Date()
        })

        // 2. Update Interview
        await Interview.findByIdAndUpdate(data.interviewId, {
            feedbackSubmitted: true,
            scorecardId: scorecard._id,
            status: InterviewStatus.COMPLETED
        })

        // 3. Emit event (optional, for scoring or workflow)
        fluxEvents.emitDomainEvent(DomainEvent.SCORE_SUBMITTED, {
            organizationId,
            interviewId: data.interviewId,
            scorecardId: scorecard._id,
            score: scorecard.overallRating
        })

        return scorecard
    }

    async getScorecard(interviewId: string, organizationId: string): Promise<IScorecard | null> {
        return Scorecard.findOne({ interviewId, organizationId: new Types.ObjectId(organizationId) })
    }
}

export const interviewService = new InterviewService()
