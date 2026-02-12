import { Types } from 'mongoose'
import { EmailTemplate, IEmailTemplate } from '../../database/models/email-template.model.js'

class EmailTemplateService {
    async create(organizationId: string, data: Partial<IEmailTemplate>): Promise<IEmailTemplate> {
        return EmailTemplate.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
        })
    }

    async list(organizationId: string): Promise<IEmailTemplate[]> {
        return EmailTemplate.find({ organizationId: new Types.ObjectId(organizationId) })
            .sort({ createdAt: -1 })
            .lean()
    }

    async getById(id: string, organizationId: string): Promise<IEmailTemplate | null> {
        return EmailTemplate.findOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
    }

    async update(id: string, organizationId: string, data: Partial<IEmailTemplate>): Promise<IEmailTemplate | null> {
        return EmailTemplate.findOneAndUpdate(
            { _id: id, organizationId: new Types.ObjectId(organizationId) },
            { $set: data },
            { new: true }
        )
    }

    async delete(id: string, organizationId: string): Promise<boolean> {
        const result = await EmailTemplate.deleteOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
        return result.deletedCount === 1
    }
}

export const emailTemplateService = new EmailTemplateService()
