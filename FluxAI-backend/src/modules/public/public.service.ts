import { Organization, Assessment, Job, Candidate, JobApplication, AuditLog } from '../../database/models/index.js'
import { jobsService } from '../jobs/jobs.service.js'
import { getJudge0LanguageId, runCode as judge0RunCode } from '../../services/judge0/judge0.client.js'
import { validateApplicationData } from '../../common/utils/application-schema.validator.js'
import { generateUploadUrl, generateStorageKey } from '../storage/s3.client.js'

class PublicService {
    async getCompanyBySlug(slug: string) {
        const organization = await Organization.findOne({ slug }).select('name slug logoUrl website branding')

        if (!organization) {
            throw { code: 'NOT_FOUND', message: 'Company not found' }
        }

        return organization
    }

    async getCompanyJobs(slug: string) {
        const organization = await this.getCompanyBySlug(slug)

        const result = await jobsService.list(organization.id, {
            status: 'PUBLISHED',
            page: 1,
            limit: 100
        })

        return result.jobs
    }

    async getJob(slug: string, jobId: string) {
        const organization = await this.getCompanyBySlug(slug)

        try {
            const job = await jobsService.getById(jobId, organization.id)
            return job
        } catch (error) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }
    }

    /**
     * Get public job by its publicSlug (not org slug)
     */
    async getJobBySlug(slug: string) {
        const job = await Job.findOne({ publicSlug: slug, status: 'PUBLISHED' })
            .populate('organizationId', 'name slug logoUrl website branding')

        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }

        // Return public-safe fields only
        return {
            _id: job._id,
            title: job.title,
            description: job.description,
            department: job.department,
            location: job.location,
            employmentType: job.employmentType,
            requiredSkills: job.requiredSkills,
            requirements: job.requirements,
            salaryRange: job.salaryRange,
            applicationSchema: job.applicationSchema,
            publicSlug: job.publicSlug,
            publishedAt: job.publishedAt,
            company: job.organizationId, // populated
        }
    }

    /**
     * Submit application for a public job
     */
    async submitApplication(slug: string, body: {
        applicationData: Record<string, unknown>
        firstName?: string
        lastName?: string
        email: string
        phone?: string
        resumeFileId?: string
    }) {
        // 1. Find the job
        const job = await Job.findOne({ publicSlug: slug, status: 'PUBLISHED' })
        if (!job) {
            const error = new Error('Job not found or no longer accepting applications') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // 2. Validate application data against the schema
        const validation = validateApplicationData(job.applicationSchema, body.applicationData || {})
        if (!validation.valid) {
            const error = new Error('Application validation failed') as Error & { statusCode: number; code: string; details: unknown }
            error.statusCode = 400
            error.code = 'VALIDATION_ERROR'
            error.details = validation.errors
            throw error
        }

        // 3. Validate email
        if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            const error = new Error('Valid email is required') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'VALIDATION_ERROR'
            throw error
        }

        const orgId = job.organizationId.toString()

        // 4. Check for duplicate application
        const existingCandidate = await Candidate.findOne({
            organizationId: orgId,
            email: body.email,
        })

        if (existingCandidate) {
            const existingApplication = await JobApplication.findOne({
                jobId: job._id,
                candidateId: existingCandidate._id,
            })
            if (existingApplication) {
                const error = new Error('You have already applied for this position') as Error & { statusCode: number; code: string }
                error.statusCode = 409
                error.code = 'DUPLICATE_APPLICATION'
                throw error
            }
        }

        // 5. Find or create candidate
        let candidate = existingCandidate
        if (!candidate) {
            candidate = await Candidate.create({
                organizationId: orgId,
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone,
                source: 'JOB_APPLICATION',
            })
        }

        // 6. Handle resume upload URL if needed
        let resumeUrl: string | undefined
        if (body.resumeFileId) {
            resumeUrl = body.resumeFileId // Already uploaded, store reference
        }

        // 7. Create application
        const application = await JobApplication.create({
            organizationId: orgId,
            jobId: job._id,
            candidateId: candidate._id,
            applicationData: body.applicationData,
            resumeUrl,
            status: 'APPLIED',
            submittedAt: new Date(),
        })

        // 8. Log audit
        try {
            await AuditLog.create({
                organizationId: orgId,
                entityType: 'JOB',
                entityId: job._id,
                action: 'APPLICATION_RECEIVED',
                newValue: {
                    candidateEmail: body.email,
                    applicationId: application._id.toString(),
                },
            })
        } catch (err) {
            console.error('[AuditLog] Failed to log application:', err)
        }

        return {
            applicationId: application._id.toString(),
            message: 'Application submitted successfully',
        }
    }

    /**
     * Request a resume upload URL for public applications
     */
    async requestResumeUploadUrl(slug: string, body: { mimeType: string; size: number }) {
        // Verify job exists and is published
        const job = await Job.findOne({ publicSlug: slug, status: 'PUBLISHED' })
        if (!job) {
            const error = new Error('Job not found') as Error & { statusCode: number; code: string }
            error.statusCode = 404
            error.code = 'NOT_FOUND'
            throw error
        }

        // Validate file size (5MB max)
        const MAX_RESUME_SIZE = 5 * 1024 * 1024
        if (body.size > MAX_RESUME_SIZE) {
            const error = new Error('Resume must be less than 5MB') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'FILE_TOO_LARGE'
            throw error
        }

        // Validate MIME type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(body.mimeType)) {
            const error = new Error('Only PDF and DOCX files are allowed') as Error & { statusCode: number; code: string }
            error.statusCode = 400
            error.code = 'INVALID_MIME_TYPE'
            throw error
        }

        const extension = body.mimeType === 'application/pdf' ? 'pdf' : 'docx'
        const storageKey = `applications/${job._id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`

        const { uploadUrl } = await generateUploadUrl(storageKey, body.mimeType, body.size)

        return {
            uploadUrl,
            storageKey,
            expiresIn: 15 * 60,
        }
    }

    /**
     * Get public assessment details (for start page)
     */
    async getAssessment(id: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mongoose = await import('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw { code: 'INVALID_INPUT', message: 'Invalid assessment ID' }
        }

        const assessment = await Assessment.findById(id).select('title organizationId rounds status')
        if (!assessment) {
            throw { code: 'NOT_FOUND', message: 'Assessment not found' }
        }

        if (assessment.status !== 'ACTIVE') {
            throw { code: 'INVALID_STATUS', message: 'Assessment is not active' }
        }

        return {
            id: assessment._id,
            title: assessment.title,
            organizationId: assessment.organizationId,
            rounds: assessment.rounds.filter(r => r.enabled).map(r => ({
                roundType: r.roundType,
                order: r.order
            }))
        }
    }

    /**
     * Run code via Judge0 (for DSA "Run Code" in UI). No auth required; rate-limit in production.
     * Judge0 defaults to hosted CE (https://ce.judge0.com). Override JUDGE0_BASE_URL for self-hosted.
     */
    async runCode(body: { code: string; language: string; stdin?: string }) {
        const baseUrl = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com'
        const languageId = getJudge0LanguageId(body.language || 'python')
        if (languageId == null) {
            const err = new Error(`Unsupported language: ${body.language}`) as Error & { statusCode: number; code: string }
            err.statusCode = 400
            err.code = 'INVALID_INPUT'
            throw err
        }
        const cpuTimeLimit = process.env.JUDGE0_CPU_TIME_LIMIT != null ? parseFloat(process.env.JUDGE0_CPU_TIME_LIMIT) : 2
        const memoryLimitKb = process.env.JUDGE0_MEMORY_LIMIT_KB != null ? parseInt(process.env.JUDGE0_MEMORY_LIMIT_KB, 10) : 128000
        try {
            const result = await judge0RunCode(
                baseUrl,
                body.code || '',
                languageId,
                body.stdin ?? '',
                {
                    authToken: process.env.JUDGE0_AUTH_TOKEN || undefined,
                    rapidApiKey: process.env.JUDGE0_RAPIDAPI_KEY || undefined,
                    rapidApiHost: process.env.JUDGE0_RAPIDAPI_HOST || undefined,
                    cpuTimeLimit,
                    memoryLimitKb,
                }
            )
            return {
                stdout: result.stdout,
                stderr: result.stderr,
                statusDescription: result.statusDescription,
                timeSeconds: result.timeSeconds,
                memoryKb: result.memoryKb,
                compileError: result.compileError ?? undefined,
                exitCode: result.exitCode ?? undefined,
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            const err = new Error(msg) as Error & { statusCode: number; code: string }
            err.statusCode = 502
            err.code = 'JUDGE0_ERROR'
            throw err
        }
    }
}

export const publicService = new PublicService()
