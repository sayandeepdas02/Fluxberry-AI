import { Types } from 'mongoose'
import { Prospect } from '../../database/models/prospect.models.js'
import { Job } from '../../database/models/index.js'
import { AppError } from '../../common/errors/index.js'
import { scoreCandidate } from '../ats-screening/scoring-v2/scoring-engine-v2.js'
import { IResumeParsedData } from '../ats-screening/models/resume-profile.model.js'
import { V2JobContext } from '../ats-screening/scoring-v2/types.js'

export class ProspectsScoringService {
    /**
     * Evaluates a prospect against all PUBLISHED jobs in the organization.
     * Caches the best result on the Prospect document if it's new.
     */
    async evaluateProspectFit(prospectId: string, organizationId: string) {
        const prospect = await Prospect.findOne({ _id: prospectId, organizationId, isDeleted: false })
        if (!prospect) {
            throw AppError.notFound('Prospect')
        }

        // Return cached result if fresh enough (e.g. less than 24 hours old)
        if (prospect.aiFitCache && prospect.aiFitCache.updatedAt) {
            const ageHours = (new Date().getTime() - prospect.aiFitCache.updatedAt.getTime()) / (1000 * 60 * 60)
            if (ageHours < 24) {
                return prospect.aiFitCache
            }
        }

        // 1. Fetch active jobs
        const jobs = await Job.find({
            organizationId,
            status: 'PUBLISHED',
            deletedAt: null
        }).lean()

        if (jobs.length === 0) {
            return null // No jobs to score against
        }

        // 2. Map Prospect to IResumeParsedData
        const parsedData: IResumeParsedData = {
            skills: prospect.skills || [],
            experience: [],
            education: [],
            projects: []
        }

        if (prospect.role) {
            parsedData.experience!.push({
                title: prospect.role,
                company: prospect.company || 'Unknown',
                durationMonths: (prospect.experience || 0) * 12,
                description: ''
            })
        }

        let bestScore = -1
        let bestResult: any = null
        let bestJobId: Types.ObjectId | null = null

        // 3. Score against all jobs
        for (const job of jobs) {
            const jobContext: V2JobContext = {
                jobTitle: job.title || '',
                jobDescription: job.description || '',
                requiredSkills: job.scoringConfig?.hardGates?.requiredSkills || job.requiredSkills || [],
                requiredEducationLevel: job.scoringConfig?.hardGates?.requiredEducationLevel,
                targetExperienceYears: job.experienceRange?.min || job.scoringConfig?.hardGates?.minimumExperienceYears || 0,
            }

            // NOTE: jdEmbedding isn't saved directly on Job right now (usually computed and cached in Redis or memory),
            // but the scoring engine will lazily compute it if missing using embedding.service.ts
            const result = await scoreCandidate(parsedData, jobContext)

            if (result.finalScore > bestScore) {
                bestScore = result.finalScore
                bestResult = result
                bestJobId = job._id as Types.ObjectId
            }
        }

        if (!bestResult || !bestJobId) return null

        // 4. Update cache
        prospect.aiFitCache = {
            jobId: bestJobId,
            score: bestResult.finalScore,
            breakdown: bestResult.breakdown,
            insights: bestResult.insights,
            updatedAt: new Date()
        }
        await prospect.save()

        return prospect.aiFitCache
    }
}

export const prospectsScoringService = new ProspectsScoringService()
