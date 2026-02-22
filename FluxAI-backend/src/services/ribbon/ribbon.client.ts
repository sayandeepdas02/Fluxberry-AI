/**
 * Ribbon API client (Ribbon.ai – interactive voice AI interviews)
 * Base: https://app.ribbon.ai/be-api
 * Auth: Authorization: Bearer <API_KEY>
 */

import type {
    RibbonCreateFlowRequest,
    RibbonCreateFlowResponse,
    RibbonCreateInterviewRequest,
    RibbonCreateInterviewResponse,
    RibbonGetInterviewResponse,
} from './ribbon.types.js'

const RIBBON_BASE_URL = process.env.RIBBON_BASE_URL || 'https://app.ribbon.ai/be-api'
const RIBBON_API_KEY = process.env.RIBBON_API_KEY

function getHeaders(): Record<string, string> {
    if (!RIBBON_API_KEY) {
        throw new Error('RIBBON_API_KEY is not set')
    }
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${RIBBON_API_KEY}`,
    }
}

export function isRibbonConfigured(): boolean {
    return !!RIBBON_API_KEY
}

/**
 * Create an interview flow (reusable script + settings).
 * Returns interview_flow_id to use when creating interviews.
 */
export async function createFlow(body: RibbonCreateFlowRequest): Promise<RibbonCreateFlowResponse> {
    const res = await fetch(`${RIBBON_BASE_URL}/v1/interview-flows`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const errText = await res.text()
        let message = `Ribbon createFlow failed: ${res.status} ${res.statusText}`
        try {
            const json = JSON.parse(errText)
            if (json.message) message = json.message
        } catch {
            if (errText) message += ` — ${errText.slice(0, 200)}`
        }
        throw new Error(message)
    }
    return res.json() as Promise<RibbonCreateFlowResponse>
}

/**
 * Create a one-use interview from a flow.
 * Returns interview_id and interview_link (candidate URL).
 */
export async function createInterview(
    interview_flow_id: string,
    candidateInfo?: {
        interviewee_email_address?: string
        interviewee_first_name?: string
        interviewee_last_name?: string
    }
): Promise<RibbonCreateInterviewResponse> {
    const body: RibbonCreateInterviewRequest = { interview_flow_id, ...candidateInfo }
    const res = await fetch(`${RIBBON_BASE_URL}/v1/interviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const errText = await res.text()
        let message = `Ribbon createInterview failed: ${res.status} ${res.statusText}`
        try {
            const json = JSON.parse(errText)
            if (json.message) message = json.message
        } catch {
            if (errText) message += ` — ${errText.slice(0, 200)}`
        }
        throw new Error(message)
    }
    return res.json() as Promise<RibbonCreateInterviewResponse>
}

/**
 * Get a single interview by ID (includes transcript, summary, scores when completed).
 */
export async function getInterview(interview_id: string): Promise<RibbonGetInterviewResponse> {
    const res = await fetch(`${RIBBON_BASE_URL}/v1/interviews/${encodeURIComponent(interview_id)}`, {
        method: 'GET',
        headers: getHeaders(),
    })
    if (!res.ok) {
        const errText = await res.text()
        let message = `Ribbon getInterview failed: ${res.status} ${res.statusText}`
        try {
            const json = JSON.parse(errText)
            if (json.message) message = json.message
        } catch {
            if (errText) message += ` — ${errText.slice(0, 200)}`
        }
        throw new Error(message)
    }
    return res.json() as Promise<RibbonGetInterviewResponse>
}
