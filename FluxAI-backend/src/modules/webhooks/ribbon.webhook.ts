/**
 * Ribbon webhook handler (interview_processed).
 * Verify X-Ribbon-Signature (HMAC-SHA256), then persist results and mark round complete.
 */

import crypto from 'crypto'
import { Request, Response } from 'express'
import { AssessmentAttempt } from '../../database/models/index.js'
import { AIInterviewSynthesis, AISynthesisStatus } from '../../database/models/index.js'
import { getInterview } from '../../services/ribbon/ribbon.client.js'
import type { RibbonWebhookPayload } from '../../services/ribbon/ribbon.types.js'

const WEBHOOK_SECRET = process.env.RIBBON_WEBHOOK_SECRET || ''

function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!WEBHOOK_SECRET || !signatureHeader) return false
    const computed = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(signatureHeader, 'utf8'))
}

export async function handleRibbonWebhook(req: Request, res: Response): Promise<void> {
    const rawBody = req.body as Buffer
    if (!Buffer.isBuffer(rawBody)) {
        res.status(400).json({ success: false, error: 'Invalid body' })
        return
    }
    const signature = req.headers['x-ribbon-signature'] as string | undefined
    if (!verifySignature(rawBody, signature)) {
        res.status(401).json({ success: false, error: 'Invalid signature' })
        return
    }
    let payload: RibbonWebhookPayload
    try {
        payload = JSON.parse(rawBody.toString('utf8')) as RibbonWebhookPayload
    } catch {
        res.status(400).json({ success: false, error: 'Invalid JSON' })
        return
    }
    if (payload.event_type !== 'interview_processed' && payload.event_type !== 'video_processed') {
        res.status(200).json({ success: true })
        return
    }
    const interviewId = payload.interview_id
    const attempt = await AssessmentAttempt.findOne({ 'rounds.ribbonInterviewId': interviewId })
    if (!attempt) {
        console.warn('[Ribbon Webhook] No attempt found for interview_id:', interviewId)
        res.status(200).json({ success: true })
        return
    }
    const aiRound = attempt.rounds.find(r => r.roundType === 'AI' && r.ribbonInterviewId === interviewId)
    if (!aiRound) {
        res.status(200).json({ success: true })
        return
    }
    try {
        const interview = await getInterview(interviewId)
        if (interview.status !== 'completed' || !interview.interview_data) {
            res.status(200).json({ success: true })
            return
        }
        const data = interview.interview_data
        const sessionId = interviewId

        const existing = await AIInterviewSynthesis.findOne({ sessionId })
        if (existing && existing.status === AISynthesisStatus.COMPLETED) {
            res.status(200).json({ success: true })
            return
        }

        const strengths: string[] = []
        const gaps: string[] = []
        if (data.scores) {
            const s = data.scores
            if (s.communication != null) strengths.push(`Communication: ${s.communication}`)
            if (s.skills != null) strengths.push(`Skills: ${s.skills}`)
            if (s.motivation != null) strengths.push(`Motivation: ${s.motivation}`)
            if (s.language_fluency_and_pace != null) strengths.push(`Fluency: ${s.language_fluency_and_pace}`)
        }

        await AIInterviewSynthesis.findOneAndUpdate(
            { sessionId },
            {
                attemptId: attempt._id,
                sessionId,
                version: '1.0-ribbon',
                overallSummary: data.summary || data.transcript?.slice(0, 2000) || '',
                strengths,
                gaps,
                suggestedFollowUps: [],
                totalQuestions: data.questions_to_transcript_mapping?.length ?? 0,
                processedQuestions: data.questions_to_transcript_mapping?.length ?? 0,
                status: AISynthesisStatus.COMPLETED,
                transcript: data.transcript || undefined,
            },
            { upsert: true, new: true }
        )

        aiRound.status = 'COMPLETED'
        aiRound.endedAt = new Date()
        if (aiRound.startedAt) {
            aiRound.aiDurationSeconds = Math.floor((Date.now() - new Date(aiRound.startedAt).getTime()) / 1000)
        }
        const allCompleted = attempt.rounds.every(
            r => r.status === 'COMPLETED' || r.status === 'SKIPPED'
        )
        if (allCompleted) {
            attempt.status = 'COMPLETED'
            attempt.submittedAt = new Date()
        }
        await attempt.save()
    } catch (err) {
        console.error('[Ribbon Webhook] Failed to process interview', interviewId, err)
        res.status(500).json({ success: false, error: 'Processing failed' })
        return
    }
    res.status(200).json({ success: true })
}
