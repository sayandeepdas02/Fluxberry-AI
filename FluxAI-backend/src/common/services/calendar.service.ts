import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

class CalendarService {
    private oauth2Client: OAuth2Client

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        )
    }

    /**
     * Generate Auth URL for user to connect calendar
     */
    generateAuthUrl(): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
        })
    }

    /**
     * Exchange code for tokens
     */
    async getTokens(code: string) {
        const { tokens } = await this.oauth2Client.getToken(code)
        return tokens
    }

    /**
     * Create a calendar event
     */
    async createEvent(
        authTokens: any, // Access token, Refresh token, etc.
        eventDetails: {
            summary: string
            description: string
            startTime: Date
            endTime: Date
            attendees: string[]
        }
    ) {
        this.oauth2Client.setCredentials(authTokens)
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

        const event = {
            summary: eventDetails.summary,
            description: eventDetails.description,
            start: {
                dateTime: eventDetails.startTime.toISOString(),
            },
            end: {
                dateTime: eventDetails.endTime.toISOString(),
            },
            attendees: eventDetails.attendees.map((email) => ({ email })),
            conferenceData: {
                createRequest: { requestId: Math.random().toString(36).substring(7) },
            },
        }

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
        })

        return response.data
    }
}

// Export singleton instance? 
// No, because we might need per-request instances or setCredentials often.
// But the methods set credentials on the client instance which is shared if singleton.
// Better to instantiate per request OR handle token passing carefully.
// For now, singleton is risky if concurrent requests set different credentials.
// I'll export a singleton but ensure `setCredentials` is called before usage. 
// BUT `oauth2Client` is shared state.
// So I should probably NOT use a singleton that stores state, or create a new client per request.
// Creating new client is cheap.

export const createCalendarService = () => new CalendarService()
