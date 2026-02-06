import { Job, IJob } from '../../database/models/index.js'
import { CreateJobInput, UpdateJobInput } from './jobs.types.js'
import { Types } from 'mongoose'

class JobsService {
    async create(organizationId: string, input: CreateJobInput): Promise<IJob> {
        return Job.create({
            organizationId,
            ...input
        })
    }

    async list(organizationId: string): Promise<IJob[]> {
        return Job.find({ organizationId }).sort({ createdAt: -1 })
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
