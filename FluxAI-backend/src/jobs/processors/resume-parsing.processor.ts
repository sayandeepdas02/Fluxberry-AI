import { Job } from 'bullmq'
import { Candidate } from '../../database/models/index.js'

export interface ResumeParsingJobData {
    candidateId: string
    resumeUrl: string
    organizationId: string
}

/**
 * Resume parsing processor — extracts text and metadata from uploaded resumes
 * In production, use a PDF parsing library (e.g. pdf-parse, or an AI service)
 */
export async function processResumeParsingJob(job: Job<ResumeParsingJobData>): Promise<void> {
    const { candidateId, resumeUrl, organizationId } = job.data
    console.log(`[ResumeParsing] Processing resume for candidate ${candidateId}`)

    try {
        // TODO: Integrate a real PDF parsing service here
        // For now, we'll store a placeholder to demonstrate the flow
        const parsedData: Record<string, unknown> = {
            rawText: '', // Would contain extracted text
            parsedAt: new Date().toISOString(),
            source: resumeUrl,
            status: 'PENDING_REAL_PARSER',
        }

        await Candidate.findByIdAndUpdate(candidateId, {
            parsedResumeData: parsedData,
        })

        console.log(`[ResumeParsing] ✅ Resume parsed for candidate ${candidateId}`)
    } catch (err) {
        console.error(`[ResumeParsing] ❌ Failed for candidate ${candidateId}:`, err)
        throw err // Let BullMQ handle retries
    }
}
