import { Queue, QueueOptions } from 'bullmq'
import { redisConnection } from '../redis.js'
import { ResumeParsingJobData } from '../processors/resume-parsing.processor.js'
import { EmailJobData } from '../processors/email.processor.js'
import { AnalyticsAggregationJobData } from '../processors/analytics-aggregation.processor.js'
import { WorkflowJobData } from '../processors/workflow.processor.js'

// Queue configuration
const queueOptions: QueueOptions = {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
    },
}

// ============================================
// EVALUATION QUEUE
// ============================================

export interface EvaluateMCQJob {
    type: 'EVALUATE_MCQ'
    attemptId: string
    answers: Record<string, string[]>
}

export interface EvaluateDSAJob {
    type: 'EVALUATE_DSA'
    attemptId: string
    /** Optional: if provided (e.g. from submitRound), use this single submission; else processor loads all answers from attempt. */
    submission?: {
        code: string
        language: string
    }
}

export interface EvaluateAIJob {
    type: 'EVALUATE_AI'
    attemptId: string
    refs: {
        transcriptRef?: string
        videoRef?: string
    }
}

export type EvaluationJobData = EvaluateMCQJob | EvaluateDSAJob | EvaluateAIJob

export const evaluationQueue = new Queue<EvaluationJobData>('evaluation', queueOptions)

// ============================================
// NOTIFICATION QUEUE
// ============================================

export interface SendInviteEmailJob {
    type: 'SEND_INVITE_EMAIL'
    candidateEmail: string
    candidateName?: string
    assessmentId: string
    assessmentTitle: string
    inviteLink: string
}

export interface SendResultEmailJob {
    type: 'SEND_RESULT_EMAIL'
    candidateEmail: string
    candidateName?: string
    assessmentTitle: string
    resultLink: string
}

export type NotificationJobData = SendInviteEmailJob | SendResultEmailJob

export const notificationQueue = new Queue<NotificationJobData>('notification', queueOptions)

// ============================================
// AI INTERVIEW PROCESSING QUEUE
// ============================================

export interface ProcessAIResponseJob {
    type: 'PROCESS_AI_RESPONSE'
    attemptId: string
    sessionId: string
    questionId: string
    storageKey: string
}

export interface SynthesizeAIInterviewJob {
    type: 'SYNTHESIZE_AI_INTERVIEW'
    attemptId: string
    sessionId: string
}

export type AIInterviewJobData = ProcessAIResponseJob | SynthesizeAIInterviewJob

export const aiInterviewQueue = new Queue<AIInterviewJobData>('ai-interview', queueOptions)

// ============================================
// RESUME PARSING QUEUE
// ============================================
export const resumeParsingQueue = new Queue<ResumeParsingJobData>('resume-parsing', queueOptions)

// ============================================
// EMAIL QUEUE (tracked email sending)
// ============================================
export const emailQueue = new Queue<EmailJobData>('email', queueOptions)

// ============================================
// ANALYTICS AGGREGATION QUEUE
// ============================================
export const analyticsQueue = new Queue<AnalyticsAggregationJobData>('analytics-aggregation', queueOptions)

// ============================================
// WORKFLOW QUEUE
// ============================================
export const workflowQueue = new Queue<WorkflowJobData>('workflow', queueOptions)

// ============================================
// ATS SCREENING QUEUE
// ============================================
export interface AtsScreeningJobData {
    type: 'CANDIDATE_APPLIED'
    applicationId: string
    candidateId: string
    jobId: string
    organizationId: string
}
export const atsScreeningQueue = new Queue<AtsScreeningJobData>('ats-screening', {
    ...queueOptions,
    defaultJobOptions: {
        ...queueOptions.defaultJobOptions,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: false // Keep failed jobs in Dead Letter Queue for monitoring dashboard
    }
})


// ============================================
// JOB PRODUCERS
// ============================================

export async function enqueueEvaluationJob(data: EvaluationJobData): Promise<string> {
    const job = await evaluationQueue.add(data.type, data, {
        jobId: `${data.type}-${data.attemptId}-${Date.now()}`,
    })
    console.log(`📤 Enqueued ${data.type} job: ${job.id}`)
    return job.id || ''
}

export async function enqueueNotificationJob(data: NotificationJobData): Promise<string> {
    const jobId =
        data.type === 'SEND_INVITE_EMAIL'
            ? `${data.type}-${data.assessmentId}-${data.candidateEmail}-${Date.now()}`
            : `${data.type}-${Date.now()}`
    const job = await notificationQueue.add(data.type, data, { jobId })
    console.log(`📤 Enqueued ${data.type} job: ${job.id}`)
    return job.id || ''
}

export async function enqueueAIInterviewJob(data: AIInterviewJobData): Promise<string> {
    const jobId = data.type === 'PROCESS_AI_RESPONSE'
        ? `${data.type}-${data.sessionId}-${data.questionId}-${Date.now()}`
        : `${data.type}-${data.sessionId}-${Date.now()}`
    const job = await aiInterviewQueue.add(data.type, data, { jobId })
    console.log(`📤 Enqueued ${data.type} job: ${job.id}`)
    return job.id || ''
}

export async function enqueueResumeParsingJob(data: ResumeParsingJobData): Promise<string> {
    const job = await resumeParsingQueue.add('PARSE_RESUME', data, {
        jobId: `PARSE_RESUME-${data.candidateId}-${Date.now()}`,
    })
    console.log(`📤 Enqueued PARSE_RESUME job: ${job.id}`)
    return job.id || ''
}

export async function enqueueEmailJob(data: EmailJobData): Promise<string> {
    const job = await emailQueue.add('SEND_EMAIL', data, {
        jobId: `SEND_EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    })
    console.log(`📤 Enqueued SEND_EMAIL job: ${job.id}`)
    return job.id || ''
}

export async function enqueueAnalyticsJob(data: AnalyticsAggregationJobData): Promise<string> {
    const job = await analyticsQueue.add(data.type, data, {
        jobId: `${data.type}-${data.organizationId}-${Date.now()}`,
    })
    console.log(`📤 Enqueued ${data.type} job: ${job.id}`)
    return job.id || ''
}

export async function enqueueWorkflowJob(data: WorkflowJobData): Promise<string> {
    const job = await workflowQueue.add('EXECUTE_WORKFLOW', data, {
        jobId: `WORKFLOW-${data.actionType}-${data.entityId}-${Date.now()}`,
    })
    console.log(`📤 Enqueued WORKFLOW job: ${job.id}`)
    return job.id || ''
}

export async function enqueueAtsScreeningJob(data: AtsScreeningJobData): Promise<string> {
    const job = await atsScreeningQueue.add(data.type, data, {
        jobId: `${data.type}-${data.applicationId}-${Date.now()}`,
    })
    console.log(`📤 Enqueued ${data.type} job: ${job.id}`)
    return job.id || ''
}

