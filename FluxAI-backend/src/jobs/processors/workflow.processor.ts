import { Job } from 'bullmq'
import { ActionType, ActionTypeValue } from '../../database/models/workflow.models.js'
import { enqueueEmailJob } from '../queues/index.js'
import { JobApplication, Candidate, ApplicationStatus, ApplicationStatusType } from '../../database/models/index.js'

export interface WorkflowJobData {
    actionType: ActionTypeValue
    actionConfig: Record<string, any>
    entityId: string
    entityType: string
    organizationId: string
    triggerData?: any
}

export const processWorkflowJob = async (job: Job<WorkflowJobData>) => {
    const { actionType, actionConfig, entityId, organizationId, triggerData } = job.data
    console.log(`⚙️ Processing Workflow Action: ${actionType} for ${entityId}`)

    try {
        switch (actionType) {
            case ActionType.SEND_EMAIL:
                await handleSendEmail(actionConfig, entityId, organizationId, triggerData)
                break

            case ActionType.MOVE_STAGE:
                await handleMoveStage(actionConfig, entityId, organizationId)
                break

            case ActionType.ADD_TAG:
                await handleAddTag(actionConfig, entityId, organizationId)
                break

            case ActionType.ASSIGN_RECRUITER:
                await handleAssignRecruiter(actionConfig, entityId, organizationId)
                break

            default:
                console.warn(`⚠️ Unknown action type: ${actionType}`)
        }
    } catch (error: any) {
        console.error(`❌ Workflow Action Failed: ${error.message}`)
        throw error
    }
}

async function handleSendEmail(config: any, entityId: string, organizationId: string, triggerData: any) {
    let toEmail = config.to

    if (config.recipientType === 'CANDIDATE' && triggerData?.candidateEmail) {
        toEmail = triggerData.candidateEmail
    }

    if (!toEmail) {
        throw new Error('No recipient email found for workflow action')
    }

    // Render template variables if body contains {{ }} placeholders
    let renderedBody = config.body || '<p>Hello</p>'
    if (triggerData && renderedBody.includes('{{')) {
        const vars: Record<string, string> = {
            '{{firstName}}': triggerData.candidateName?.split(' ')[0] || '',
            '{{lastName}}': triggerData.candidateName?.split(' ').slice(1).join(' ') || '',
            '{{email}}': triggerData.candidateEmail || '',
            '{{jobTitle}}': triggerData.jobTitle || '',
            '{{stage}}': triggerData.stage || '',
        }
        for (const [key, val] of Object.entries(vars)) {
            renderedBody = renderedBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), val)
        }
    }

    await enqueueEmailJob({
        to: toEmail,
        subject: config.subject || 'Notification',
        html: renderedBody,
        organizationId,
        metadata: { workflow: true, entityId }
    })
}

async function handleMoveStage(config: any, entityId: string, organizationId: string) {
    const { stageId, targetStatus } = config
    if (!targetStatus) {
        console.warn(`[Workflow] MoveStage: No targetStatus provided for ${entityId}`)
        return
    }

    const validStatuses = Object.values(ApplicationStatus)
    if (!validStatuses.includes(targetStatus as any)) {
        console.error(`[Workflow] MoveStage: Invalid status "${targetStatus}"`)
        return
    }

    const app = await JobApplication.findOne({ _id: entityId, organizationId })
    if (!app) {
        console.error(`[Workflow] MoveStage: Application ${entityId} not found`)
        return
    }

    app.status = targetStatus as ApplicationStatusType
    if (stageId) app.currentStageId = stageId
    app.lastActivityAt = new Date()
    await app.save()

    console.log(`[Workflow] ✅ Moved application ${entityId} to stage ${targetStatus}`)
}

async function handleAddTag(config: any, entityId: string, organizationId: string) {
    const { tag } = config
    if (!tag) {
        console.warn(`[Workflow] AddTag: No tag provided for ${entityId}`)
        return
    }

    const candidate = await Candidate.findOneAndUpdate(
        { _id: entityId, organizationId },
        { $addToSet: { tags: tag } },
        { new: true }
    )

    if (!candidate) {
        console.error(`[Workflow] AddTag: Candidate ${entityId} not found`)
        return
    }

    console.log(`[Workflow] ✅ Added tag "${tag}" to candidate ${entityId}`)
}

async function handleAssignRecruiter(config: any, entityId: string, organizationId: string) {
    const { recruiterId } = config
    if (!recruiterId) {
        console.warn(`[Workflow] AssignRecruiter: No recruiterId provided for ${entityId}`)
        return
    }

    const app = await JobApplication.findOneAndUpdate(
        { _id: entityId, organizationId },
        { $set: { assignedTo: recruiterId, lastActivityAt: new Date() } },
        { new: true }
    )

    if (!app) {
        console.error(`[Workflow] AssignRecruiter: Application ${entityId} not found`)
        return
    }

    console.log(`[Workflow] ✅ Assigned recruiter ${recruiterId} to application ${entityId}`)
}
