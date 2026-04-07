import { Job } from 'bullmq'
import { Candidate, JobApplication } from '../../database/models/index.js'
import { ResumeProfile } from '../../modules/ats-screening/models/resume-profile.model.js'
import { enqueueAtsScreeningJob } from '../queues/index.js'
import { resumeParsingService } from '../../services/resume-parsing.service.js'
import { resumeExtractionService } from '../../services/resume-extraction.service.js'
import type { IResumeParsedData } from '../../modules/ats-screening/models/resume-profile.model.js'

export interface ResumeParsingJobData {
    candidateId: string
    resumeUrl: string
    organizationId: string
}

// ──────────────────────────────────────────────────────────────
// Processor
// ──────────────────────────────────────────────────────────────

/**
 * Resume parsing processor — extracts text and structured data from uploaded resumes.
 *
 * Pipeline:
 *   1. Extract raw text from PDF/DOCX via resumeParsingService
 *   2. Run GPT-based structured extraction via resumeExtractionService
 *   3. Persist to Candidate.parsedResumeData (backward compat) + ResumeProfile (ATS screening)
 *   4. Trigger ATS screening for all active applications
 */
export async function processResumeParsingJob(job: Job<ResumeParsingJobData>): Promise<void> {
    const { candidateId, resumeUrl, organizationId } = job.data
    const startTime = Date.now()

    const logCtx = {
        module: 'RESUME_PARSING',
        candidateId,
        organizationId,
        resumeUrl,
    }

    console.log(`[ResumeParsing] Starting resume parse`, logCtx)

    try {
        // ── Step 1: Extract raw text ─────────────────────────────
        const parseResult = await resumeParsingService.parse(resumeUrl)

        console.log(`[ResumeParsing] Text extraction complete`, {
            ...logCtx,
            fileType: parseResult.fileType,
            status: parseResult.status,
            textLength: parseResult.textLength,
            parsingDurationMs: parseResult.parsingDurationMs,
            ...(parseResult.failureReason && { failureReason: parseResult.failureReason }),
        })

        // ── Step 2: Handle non-success statuses ──────────────────
        if (parseResult.status !== 'PARSED') {
            const failedParsedData: Record<string, unknown> = {
                rawText: '',
                parsedAt: new Date().toISOString(),
                source: resumeUrl,
                status: parseResult.status,
                fileType: parseResult.fileType,
                failureReason: parseResult.failureReason,
                parsingDurationMs: parseResult.parsingDurationMs,
            }

            // Update Candidate (backward compat)
            await Candidate.findByIdAndUpdate(candidateId, {
                parsedResumeData: failedParsedData,
            })

            // Also update ResumeProfile so the ATS screening processor
            // can detect the failure and stop retrying
            await ResumeProfile.findOneAndUpdate(
                { candidateId, organizationId },
                {
                    $set: {
                        parsedData: {
                            rawText: '',
                            skills: [],
                            experience: [],
                            education: [],
                            projects: [],
                        } satisfies IResumeParsedData,
                        // NOTE: parsedAt is intentionally NOT set here.
                        // The ATS screening processor uses parsedAt != null to determine
                        // if parsing succeeded. Leaving it null signals "not successfully parsed".
                    },
                },
                { upsert: true, new: true }
            )

            console.warn(
                `[ResumeParsing] ⚠️ Parse failed for candidate ${candidateId}: ${parseResult.status}`,
                { ...logCtx, failureReason: parseResult.failureReason }
            )
            return // Do NOT throw — this is a permanent failure, not a retry-able one
        }

        // ── Step 3: Structured extraction via GPT ────────────────
        const extractionStart = Date.now()
        const structuredData = await resumeExtractionService.extract(parseResult.rawText)
        const extractionDurationMs = Date.now() - extractionStart

        console.log(`[ResumeParsing] Structured extraction complete`, {
            ...logCtx,
            skillCount: structuredData.skills?.length ?? 0,
            experienceCount: structuredData.experience?.length ?? 0,
            educationCount: structuredData.education?.length ?? 0,
            projectCount: structuredData.projects?.length ?? 0,
            extractionDurationMs,
        })

        // ── Step 4: Persist to Candidate (backward compat) ──────
        const parsedData: Record<string, unknown> = {
            rawText: parseResult.rawText,
            parsedAt: new Date().toISOString(),
            source: resumeUrl,
            status: 'PARSED',
            fileType: parseResult.fileType,
            textLength: parseResult.textLength,
            parsingDurationMs: parseResult.parsingDurationMs,
            extractionDurationMs,
        }

        await Candidate.findByIdAndUpdate(candidateId, {
            parsedResumeData: parsedData,
        })

        // ── Step 5: Upsert ResumeProfile (ATS Screening reads this) ──
        await ResumeProfile.findOneAndUpdate(
            { candidateId, organizationId },
            {
                $set: {
                    parsedData: structuredData,
                    parsedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        )

        // ── Step 6: Trigger screening for all active applications ──
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

        const totalDurationMs = Date.now() - startTime

        console.log(
            `[ResumeParsing] ✅ Resume parsed for candidate ${candidateId} | ` +
            `${parseResult.textLength} chars | ${structuredData.skills?.length ?? 0} skills | ` +
            `${applications.length} screening jobs enqueued | ${totalDurationMs}ms total`,
            logCtx
        )

    } catch (err) {
        const totalDurationMs = Date.now() - startTime
        console.error(
            `[ResumeParsing] ❌ Failed for candidate ${candidateId} after ${totalDurationMs}ms:`,
            { ...logCtx, error: err instanceof Error ? err.message : String(err) }
        )
        throw err // Let BullMQ handle retries
    }
}
