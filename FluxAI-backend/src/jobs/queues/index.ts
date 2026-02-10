import { Queue, QueueOptions } from 'bullmq'
import { redisConnection } from '../redis.js'

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
    submission: {
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
