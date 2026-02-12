import { Job } from 'bullmq'
import { ActionType, ActionTypeValue } from '../../database/models/workflow.models.js'
// import { EmailLog } from '../../database/models/index.js'
import { enqueueEmailJob } from '../queues/index.js'

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
    // Determine 'to' address based on config (e.g. 'candidate', 'hiring_manager', or fixed email)
    // For now, assume it's sending to the candidate if entity is Candidate or Application
    let toEmail = config.to

    if (config.recipientType === 'CANDIDATE' && triggerData?.candidateEmail) {
        toEmail = triggerData.candidateEmail
    }

    if (!toEmail) {
        throw new Error('No recipient email found for workflow action')
    }

    await enqueueEmailJob({
        to: toEmail,
        subject: config.subject || 'Notification',
        html: config.body || '<p>Hello</p>', // TODO: Template rendering
        organizationId,
        metadata: { workflow: true, entityId }
    })
}

async function handleMoveStage(config: any, entityId: string, organizationId: string) {
    // TODO: Implement stage move using ApplicationService
    console.log(`[Mock] Moving application ${entityId} to stage ${config.stageId}`)
}

async function handleAddTag(config: any, entityId: string, organizationId: string) {
    // TODO: Implement add tag using CandidateService
    console.log(`[Mock] Adding tag ${config.tag} to candidate ${entityId}`)
}

async function handleAssignRecruiter(config: any, entityId: string, organizationId: string) {
    // TODO: Implement assign recruiter
    console.log(`[Mock] Assigning recruiter ${config.recruiterId} to ${entityId}`)
}
