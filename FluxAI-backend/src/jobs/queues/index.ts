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
    const job = await notificationQueue.add(data.type, data, {
        jobId: `${data.type}-${Date.now()}`,
    })
    console.log(`📤 Enqueued ${data.type} job: ${job.id}`)
    return job.id || ''
}
