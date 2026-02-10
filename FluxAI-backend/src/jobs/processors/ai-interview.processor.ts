/**
 * AI Interview Job Processor
 * 
 * Handles two job types:
 * 1. PROCESS_AI_RESPONSE — Download video from S3, run STT, run per-answer analysis
 * 2. SYNTHESIZE_AI_INTERVIEW — Aggregate all response analyses into session synthesis
 */

import { Job } from 'bullmq'
import {
    AIInterviewResponse,
    AIInterviewSynthesis,
    AIResponseStatus,
    AISynthesisStatus,
} from '../../database/models/index.js'
import { getObjectBuffer } from '../../modules/storage/s3.client.js'
import { getSTTProvider } from '../../services/stt/stt.provider.js'
import { getAnalysisProvider } from '../../services/analysis/analysis.provider.js'
import { enqueueAIInterviewJob } from '../queues/index.js'
import type { AIInterviewJobData, ProcessAIResponseJob, SynthesizeAIInterviewJob } from '../queues/index.js'

const ANALYSIS_VERSION = '1.0-stub'

export async function processAIInterviewJob(job: Job<AIInterviewJobData>): Promise<void> {
    const data = job.data

    switch (data.type) {
        case 'PROCESS_AI_RESPONSE':
            await processResponse(data)
            break
        case 'SYNTHESIZE_AI_INTERVIEW':
            await synthesizeInterview(data)
            break
        default:
            console.warn(`[AI Processor] Unknown job type:`, data)
    }
}

// ────── PROCESS SINGLE RESPONSE ──────

async function processResponse(data: ProcessAIResponseJob): Promise<void> {
    const { sessionId, questionId, storageKey } = data

    const response = await AIInterviewResponse.findOne({ sessionId, questionId })
    if (!response) {
        console.error(`[AI Processor] Response not found: ${sessionId}/${questionId}`)
        return
    }

    // Idempotent: skip if already processed
    if (response.status === AIResponseStatus.PROCESSED) {
        console.log(`[AI Processor] Already processed: ${sessionId}/${questionId}`)
        return
    }

    try {
        // Mark as processing
        response.status = AIResponseStatus.PROCESSING
        response.processingStartedAt = new Date()
        await response.save()

        // Step 1: Download audio/video from S3
        console.log(`[AI Processor] Downloading ${storageKey}...`)
        let audioBuffer: Buffer
        try {
            audioBuffer = await getObjectBuffer(storageKey)
            console.log(`[AI Processor] Downloaded ${audioBuffer.length} bytes`)
        } catch (err) {
            console.warn(`[AI Processor] S3 download failed for ${storageKey}, using empty buffer for stub`)
            audioBuffer = Buffer.alloc(0)
        }

        // Step 2: Speech-to-Text
        console.log(`[AI Processor] Running STT...`)
        const sttProvider = getSTTProvider()
        const transcription = await sttProvider.transcribe(audioBuffer)

        response.transcript = transcription.text
        response.transcriptSegments = transcription.segments

        // Step 3: Per-answer analysis
        console.log(`[AI Processor] Running analysis...`)
        const analysisProvider = getAnalysisProvider()
        const analysis = await analysisProvider.analyzeResponse(transcription.text, response.questionText)

        response.analysis = {
            version: ANALYSIS_VERSION,
            ...analysis,
        }

        // Mark as processed
        response.status = AIResponseStatus.PROCESSED
        response.processingCompletedAt = new Date()
        await response.save()

        console.log(`[AI Processor] ✅ Processed response ${sessionId}/${questionId}`)

        // Check if all responses for this session are processed
        await checkAndTriggerSynthesis(sessionId, data.attemptId)
    } catch (err) {
        console.error(`[AI Processor] ❌ Failed to process ${sessionId}/${questionId}:`, err)
        response.status = AIResponseStatus.FAILED
        response.processingError = (err as Error).message
        response.processingCompletedAt = new Date()
        await response.save()
    }
}

// ────── CHECK & TRIGGER SYNTHESIS ──────

async function checkAndTriggerSynthesis(sessionId: string, attemptId: string): Promise<void> {
    const allResponses = await AIInterviewResponse.find({ sessionId })
    const uploadedOrBetter = allResponses.filter(r => r.status !== AIResponseStatus.PENDING_UPLOAD)
    const processedCount = allResponses.filter(r => r.status === AIResponseStatus.PROCESSED).length
    const failedCount = allResponses.filter(r => r.status === AIResponseStatus.FAILED).length
    const totalUploaded = uploadedOrBetter.length

    // Trigger synthesis when all uploaded responses are either processed or failed
    if (processedCount + failedCount >= totalUploaded && totalUploaded > 0) {
        console.log(`[AI Processor] All responses done (${processedCount} processed, ${failedCount} failed). Triggering synthesis.`)
        await enqueueAIInterviewJob({
            type: 'SYNTHESIZE_AI_INTERVIEW',
            attemptId,
            sessionId,
        })
    }
}

// ────── SYNTHESIZE INTERVIEW ──────

async function synthesizeInterview(data: SynthesizeAIInterviewJob): Promise<void> {
    const { sessionId, attemptId } = data

    const synthesis = await AIInterviewSynthesis.findOne({ sessionId })
    if (!synthesis) {
        console.error(`[AI Synthesis] Synthesis record not found for session: ${sessionId}`)
        return
    }

    // Idempotent
    if (synthesis.status === AISynthesisStatus.COMPLETED) {
        console.log(`[AI Synthesis] Already completed for session: ${sessionId}`)
        return
    }

    try {
        synthesis.status = AISynthesisStatus.PROCESSING
        await synthesis.save()

        // Get all processed responses
        const responses = await AIInterviewResponse.find({
            sessionId,
            status: AIResponseStatus.PROCESSED,
        }).sort({ questionIndex: 1 })

        if (responses.length === 0) {
            console.warn(`[AI Synthesis] No processed responses for session: ${sessionId}`)
            synthesis.status = AISynthesisStatus.FAILED
            await synthesis.save()
            return
        }

        // Prepare analysis inputs
        const analysisInputs = responses.map(r => ({
            question: r.questionText,
            transcript: r.transcript || '',
            analysis: r.analysis || {
                summary: [],
                keyPoints: [],
                skillsObserved: [],
                relevance: 'low' as const,
            },
        }))

        // Run synthesis
        const analysisProvider = getAnalysisProvider()
        const result = await analysisProvider.synthesizeInterview(analysisInputs)

        // Update synthesis record
        synthesis.overallSummary = result.overallSummary
        synthesis.strengths = result.strengths
        synthesis.gaps = result.gaps
        synthesis.suggestedFollowUps = result.suggestedFollowUps
        synthesis.processedQuestions = responses.length
        synthesis.version = ANALYSIS_VERSION
        synthesis.status = AISynthesisStatus.COMPLETED
        await synthesis.save()

        console.log(`[AI Synthesis] ✅ Completed synthesis for session: ${sessionId}`)
    } catch (err) {
        console.error(`[AI Synthesis] ❌ Failed for session ${sessionId}:`, err)
        synthesis.status = AISynthesisStatus.FAILED
        await synthesis.save()
    }
}
