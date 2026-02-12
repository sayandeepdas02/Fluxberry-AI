import { Types } from 'mongoose'
import { WorkflowRule, IWorkflowRule } from '../../database/models/workflow.models.js'

export class WorkflowService {
    async createRule(organizationId: string, data: Partial<IWorkflowRule>): Promise<IWorkflowRule> {
        const rule = await WorkflowRule.create({
            ...data,
            organizationId: new Types.ObjectId(organizationId),
        })
        return rule
    }

    async getRules(organizationId: string): Promise<IWorkflowRule[]> {
        return WorkflowRule.find({ organizationId: new Types.ObjectId(organizationId) })
            .sort({ createdAt: -1 })
            .lean()
    }

    async getRule(id: string, organizationId: string): Promise<IWorkflowRule | null> {
        return WorkflowRule.findOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
    }

    async updateRule(id: string, organizationId: string, data: Partial<IWorkflowRule>): Promise<IWorkflowRule | null> {
        return WorkflowRule.findOneAndUpdate(
            { _id: id, organizationId: new Types.ObjectId(organizationId) },
            { $set: data },
            { new: true }
        )
    }

    async deleteRule(id: string, organizationId: string): Promise<boolean> {
        const result = await WorkflowRule.deleteOne({ _id: id, organizationId: new Types.ObjectId(organizationId) })
        return result.deletedCount === 1
    }

    async toggleRule(id: string, organizationId: string, isActive: boolean): Promise<IWorkflowRule | null> {
        return WorkflowRule.findOneAndUpdate(
            { _id: id, organizationId: new Types.ObjectId(organizationId) },
            { $set: { isActive } },
            { new: true }
        )
    }
}

export const workflowService = new WorkflowService()
