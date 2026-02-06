import { Job, IJob } from '../../database/models/index.js'
import { ListJobsQuery, CreateJobInput, UpdateJobInput } from './jobs.types.js'

class JobsService {
    async create(organizationId: string, input: CreateJobInput): Promise<IJob> {
        return Job.create({
            organizationId,
            ...input
        })
    }

    async list(organizationId: string, query: ListJobsQuery): Promise<{ jobs: IJob[], total: number, page: number, totalPages: number }> {
        const { page = 1, limit = 20, status, search } = query
        const skip = (page - 1) * limit

        const filter: any = { organizationId }

        if (status) {
            filter.status = status
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Job.countDocuments(filter)
        ])

        return {
            jobs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getById(id: string, organizationId: string): Promise<IJob> {
        const job = await Job.findOne({ _id: id, organizationId })
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }
        return job
    }

    async update(id: string, organizationId: string, input: UpdateJobInput): Promise<IJob> {
        const job = await Job.findOneAndUpdate(
            { _id: id, organizationId },
            { $set: input },
            { new: true }
        )
        if (!job) {
            throw { code: 'NOT_FOUND', message: 'Job not found' }
        }
        return job
    }
}

export const jobsService = new JobsService()
