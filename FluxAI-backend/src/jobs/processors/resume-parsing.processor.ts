import { Job } from 'bullmq'
import { Candidate, JobApplication } from '../../database/models/index.js'
import { enqueueAtsScreeningJob } from '../queues/index.js'

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

        // Trigger screening for all active applications for this candidate
        const applications = await JobApplication.find({ candidateId, organizationId })
        for (const app of applications) {
            await enqueueAtsScreeningJob({
                type: 'CANDIDATE_APPLIED',
                applicationId: app._id.toString(),
                candidateId: candidateId,
                jobId: app.jobId.toString(),
                organizationId: organizationId
            })
        }

        console.log(`[ResumeParsing] ✅ Resume parsed for candidate ${candidateId} and triggered ATS screening for ${applications.length} applications`)
    } catch (err) {
        console.error(`[ResumeParsing] ❌ Failed for candidate ${candidateId}:`, err)
        throw err // Let BullMQ handle retries
    }
}
