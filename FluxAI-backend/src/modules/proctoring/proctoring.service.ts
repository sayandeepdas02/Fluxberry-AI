import {
    AssessmentAttempt,
    ProctoringEvent,
    RoundTypeValue,
    ProctoringEventTypeValue,
    EventSeverityType,
} from '../../database/models/index.js'
import {
    CreateProctoringEventInput,
    ProctoringEventResponse,
    ProctoringSummaryResponse,
} from './proctoring.types.js'

export class ProctoringService {
    /**
     * Log a proctoring event (append-only)
     * - No updates allowed
     * - No deletes allowed
     * - Server timestamp only
     */
    async logEvent(attemptId: string, input: CreateProctoringEventInput): Promise<ProctoringEventResponse> {
        // Verify attempt exists
        const attempt = await AssessmentAttempt.findById(attemptId)

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Create event with server timestamp (append-only)
        const event = await ProctoringEvent.create({
            attemptId,
            roundType: input.roundType as RoundTypeValue | undefined,
            eventType: input.eventType as ProctoringEventTypeValue,
            severity: (input.severity as EventSeverityType) || 'LOW',
        })

        return this.formatEvent(event)
    }

    /**
     * Get proctoring summary for an attempt
     */
    async getSummary(attemptId: string): Promise<ProctoringSummaryResponse> {
        // Verify attempt exists
        const attempt = await AssessmentAttempt.findById(attemptId)

        if (!attempt) {
            const error = new Error('Attempt not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        const events = await ProctoringEvent.find({ attemptId }).sort({ createdAt: 1 })

        // Aggregate by severity
        const bySeverity: Record<string, number> = {}
        const byType: Record<string, number> = {}

        for (const event of events) {
            bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1
            byType[event.eventType] = (byType[event.eventType] || 0) + 1
        }

        return {
            totalEvents: events.length,
            bySeverity,
            byType,
            events: events.map((e) => this.formatEvent(e)),
        }
    }

    /**
     * Format event for response
     */
    private formatEvent(event: {
        _id: { toString(): string }
        eventType: string
        severity: string
        roundType?: string | null
        createdAt: Date
    }): ProctoringEventResponse {
        return {
            id: event._id.toString(),
            eventType: event.eventType,
            severity: event.severity,
            roundType: event.roundType ?? null,
            createdAt: event.createdAt,
        }
    }
}

export const proctoringService = new ProctoringService()
