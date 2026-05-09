import { Organization, Assessment, Job, Candidate, JobApplication, AuditLog } from '../../database/models/index.js'
import { AppError } from '../../common/errors/index.js'
import { jobsService } from '../jobs/jobs.service.js'
import { getJudge0LanguageId, runCode as judge0RunCode } from '../../services/judge0/judge0.client.js'
import { validateApplicationData } from '../../common/utils/application-schema.validator.js'
import { generateUploadUrl, generateStorageKey } from '../storage/s3.client.js'
import { enqueueAtsScreeningJob } from '../../jobs/queues/index.js'

export interface PublicJobListQuery {
    search?:         string
    location?:       string
    employmentType?: string
    remote?:         boolean
    expMin?:         number
    page?:           number
    limit?:          number
}

class PublicService {
    /**
     * List all published jobs globally — powers the /jobs public board.
     * Supports text search, filters, and cursor-based pagination.
     */
    async listPublicJobs(query: PublicJobListQuery = {}) {
        const { page = 1, limit = 20, search, location, employmentType, remote, expMin } = query
        const skip = (Math.max(1, page) - 1) * Math.min(limit, 50)
        const safeLimit = Math.min(limit, 50)

        const filter: Record<string, unknown> = {
            status: 'PUBLISHED',
            deletedAt: null,
        }

        if (search && search.trim()) {
            const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
            filter['$or'] = [
                { title: re },
                { department: re },
                { requiredSkills: re },
                { location: re },
            ]
        }

        if (location && location.trim()) {
            filter['location'] = new RegExp(location.trim(), 'i')
        }

        if (employmentType) {
            filter['employmentType'] = employmentType.toUpperCase()
        }

        if (remote) {
            const existing = Array.isArray(filter['$or']) ? filter['$or'] : []
            filter['$or'] = [...existing, { location: /remote/i }]
        }

        if (expMin !== undefined && expMin > 0) {
            filter['experienceRange.max'] = { $gte: expMin }
        }

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .select('title department location employmentType requiredSkills optionalSkills experienceRange salaryRange publicSlug publishedAt organizationId')
                .populate('organizationId', 'name slug logoUrl')
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean(),
            Job.countDocuments(filter),
        ])

        const cards = jobs.map(job => ({
            _id:             job._id,
            title:           job.title,
            department:      job.department,
            location:        job.location,
            employmentType:  job.employmentType,
            requiredSkills:  (job.requiredSkills || []).slice(0, 5),
            optionalSkills:  (job.optionalSkills  || []).slice(0, 3),
            experienceRange: job.experienceRange,
            salaryRange:     job.salaryRange,
            publicSlug:      job.publicSlug,
            publishedAt:     job.publishedAt,
            company:         job.organizationId, // populated
        }))

        return {
            jobs:       cards,
            total,
            page,
            totalPages: Math.ceil(total / safeLimit),
        }
    }

    async getCompanyBySlug(slug: string) {
        const organization = await Organization.findOne({ slug }).select('name slug logoUrl website branding')

        if (!organization) {
            throw AppError.notFound('Company')
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

        return result.data
    }

    async getJob(slug: string, jobId: string) {
        const organization = await this.getCompanyBySlug(slug)

        try {
            const job = await jobsService.getById(jobId, organization.id)
            return job
        } catch (error) {
            throw AppError.notFound('Job')
        }
    }

    /**
     * Get public job by its publicSlug (not org slug)
     */
    async getJobBySlug(slug: string) {
        const job = await Job.findOne({ publicSlug: slug, status: 'PUBLISHED' })
            .populate('organizationId', 'name slug logoUrl website branding')

        if (!job) {
            throw AppError.notFound('Job')
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
        if (!job) throw AppError.notFound('Job')

        const validation = validateApplicationData(job.applicationSchema, body.applicationData || {})
        if (!validation.valid) {
            throw AppError.validation('Application validation failed', validation.errors)
        }

        if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            throw AppError.validation('Valid email is required')
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
                throw AppError.conflict('You have already applied for this position')
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

        // 9. Emit CANDIDATE_APPLIED event for ATS Screening
        enqueueAtsScreeningJob({
            type: 'CANDIDATE_APPLIED',
            applicationId: application._id.toString(),
            candidateId: candidate._id.toString(),
            jobId: job._id.toString(),
            organizationId: orgId,
        }).catch(err => console.error('[ATS] Failed to enqueue screening job:', err))

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
        if (!job) throw AppError.notFound('Job')

        const MAX_RESUME_SIZE = 5 * 1024 * 1024
        if (body.size > MAX_RESUME_SIZE) {
            throw AppError.badRequest('Resume must be less than 5MB')
        }

        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(body.mimeType)) {
            throw AppError.badRequest('Only PDF and DOCX files are allowed')
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
            throw AppError.badRequest('Invalid assessment ID')
        }

        const assessment = await Assessment.findById(id).select('title organizationId rounds status')
        if (!assessment) {
            throw AppError.notFound('Assessment')
        }

        if (assessment.status !== 'ACTIVE') {
            throw AppError.badRequest('Assessment is not active')
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
