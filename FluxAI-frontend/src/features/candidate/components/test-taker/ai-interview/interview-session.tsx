"use client"

/**
 * AI Interview Session Component — V2 (Async Recording)
 * 
 * Per-question recording flow:
 *   Question Display → Prep Timer → Recording → Upload to S3 → Next Question
 * 
 * Features:
 * - MediaRecorder for video capture (webm/mp4)
 * - Per-question state machine
 * - Progressive upload using pre-signed S3 URLs
 * - Timer enforcement (hard stop)
 * - Camera preview throughout
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useMediaRecorder } from './use-media-recorder'
import { attemptsApi, AIQuestionConfig } from '@/lib/api/attempts'
import { Clock, Upload, CheckCircle, AlertCircle, ChevronRight, Video, Loader2 } from 'lucide-react'

interface InterviewSessionProps {
    attemptId: string
    sessionId: string
    questions: AIQuestionConfig[]
    onEndInterview: (reason: 'COMPLETED' | 'TIMEOUT' | 'CANDIDATE_EXIT') => void
}

type QuestionPhase = 'idle' | 'preparing' | 'recording' | 'uploading' | 'uploaded' | 'failed'

interface QuestionState {
    phase: QuestionPhase
    recordingDuration: number
    uploadProgress: number
    error?: string
}

export function InterviewSession({
    attemptId,
    sessionId,
    questions,
    onEndInterview,
}: InterviewSessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [questionStates, setQuestionStates] = useState<QuestionState[]>(
        questions.map(() => ({ phase: 'idle', recordingDuration: 0, uploadProgress: 0 }))
    )
    const [isCompleting, setIsCompleting] = useState(false)

    const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [prepTimeLeft, setPrepTimeLeft] = useState(0)
    const [recordTimeLeft, setRecordTimeLeft] = useState(0)

    const videoPreviewRef = useRef<HTMLVideoElement>(null)
    const {
        start: startRecording,
        stop: stopRecording,
        blob,
        isRecording,
        stream,
        requestPermission,
        reset: resetRecorder,
        duration: recordingDuration,
    } = useMediaRecorder({ video: true, audio: true })

    const currentQuestion = questions[currentIndex]
    const currentState = questionStates[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1

    // Set video preview stream
    useEffect(() => {
        if (stream && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream
        }
    }, [stream])

    // Request permissions on mount
    useEffect(() => {
        requestPermission()
    }, [])

    // Update question state helper
    const updateState = useCallback((index: number, updates: Partial<QuestionState>) => {
        setQuestionStates(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s))
    }, [])

    // ─── PREP PHASE ───
    const startPrep = useCallback(() => {
        const question = questions[currentIndex]
        setPrepTimeLeft(question.prepSeconds)
        updateState(currentIndex, { phase: 'preparing' })

        prepTimerRef.current = setInterval(() => {
            setPrepTimeLeft(prev => {
                if (prev <= 1) {
                    if (prepTimerRef.current) clearInterval(prepTimerRef.current)
                    // Auto-start recording after prep
                    handleStartRecording()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [currentIndex, questions])

    // ─── RECORDING PHASE ───
    const handleStartRecording = useCallback(async () => {
        if (prepTimerRef.current) clearInterval(prepTimerRef.current)
        updateState(currentIndex, { phase: 'recording' })
        resetRecorder()
        await startRecording()

        const question = questions[currentIndex]
        setRecordTimeLeft(question.answerSeconds)

        recordTimerRef.current = setInterval(() => {
            setRecordTimeLeft(prev => {
                if (prev <= 1) {
                    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
                    stopRecording()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [currentIndex, questions, startRecording, stopRecording, resetRecorder])

    // ─── UPLOAD WHEN BLOB READY ───
    useEffect(() => {
        if (blob && questionStates[currentIndex]?.phase === 'recording') {
            handleUpload(currentIndex, blob)
        }
    }, [blob])

    const handleUpload = useCallback(async (qIndex: number, videoBlob: Blob) => {
        if (recordTimerRef.current) clearInterval(recordTimerRef.current)
        updateState(qIndex, { phase: 'uploading', recordingDuration: recordingDuration })

        try {
            // 1. Get pre-signed URL
            const initRes = await attemptsApi.initAIUpload(
                attemptId,
                sessionId,
                questions[qIndex].id,
                videoBlob.type || 'video/webm'
            )
            if (!initRes.success || !initRes.data) {
                throw new Error(initRes.error?.message || 'Failed to get upload URL')
            }

            // 2. Upload to S3
            const uploadRes = await fetch(initRes.data.uploadUrl, {
                method: 'PUT',
                body: videoBlob,
                headers: { 'Content-Type': videoBlob.type || 'video/webm' },
            })
            if (!uploadRes.ok) throw new Error('Upload to storage failed')

            updateState(qIndex, { uploadProgress: 100 })

            // 3. Mark upload complete
            await attemptsApi.completeAIUpload(
                attemptId,
                sessionId,
                questions[qIndex].id,
                recordingDuration
            )

            updateState(qIndex, { phase: 'uploaded' })
        } catch (err) {
            console.error('Upload failed:', err)
            updateState(qIndex, {
                phase: 'failed',
                error: (err as Error).message,
            })
        }
    }, [attemptId, sessionId, questions, recordingDuration])

    // ─── STOP RECORDING MANUALLY ───
    const handleStopRecording = useCallback(() => {
        if (recordTimerRef.current) clearInterval(recordTimerRef.current)
        stopRecording()
    }, [stopRecording])

    // ─── NEXT QUESTION ───
    const handleNextQuestion = useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            resetRecorder()
        }
    }, [currentIndex, questions.length, resetRecorder])

    // ─── COMPLETE INTERVIEW ───
    const handleComplete = useCallback(async () => {
        setIsCompleting(true)
        try {
            await attemptsApi.completeAISession(attemptId, sessionId)
            onEndInterview('COMPLETED')
        } catch (err) {
            console.error('Failed to complete session:', err)
            // Still proceed — server-side will handle
            onEndInterview('COMPLETED')
        }
    }, [attemptId, sessionId, onEndInterview])

    // ─── SKIP PREP ───
    const handleSkipPrep = useCallback(() => {
        if (prepTimerRef.current) clearInterval(prepTimerRef.current)
        handleStartRecording()
    }, [handleStartRecording])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (prepTimerRef.current) clearInterval(prepTimerRef.current)
            if (recordTimerRef.current) clearInterval(recordTimerRef.current)
        }
    }, [])

    // ─── FORMAT TIME ───
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // ─── RENDER ───
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-orange-500" />
                    <h1 className="text-lg font-semibold">AI Interview</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-400">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                        {questions.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${questionStates[i]?.phase === 'uploaded' ? 'bg-green-500' : questionStates[i]?.phase === 'failed' ? 'bg-red-500' : i === currentIndex ? 'bg-orange-500' : 'bg-neutral-700' }`}
                            />
                        ))}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
                {/* Left: Video preview */}
                <div className="lg:w-1/2 flex flex-col gap-4">
                    <div className="relative rounded-xl overflow-hidden bg-neutral-900 aspect-video">
                        <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover mirror"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        {/* Recording indicator */}
                        {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 px-3 py-1.5 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                REC {formatTime(recordingDuration)}
                            </div>
                        )}
                        {/* Timer overlay */}
                        {currentState?.phase === 'preparing' && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl text-orange-500 mb-2">{prepTimeLeft}</div>
                                    <p className="text-neutral-300 text-lg">Prepare your answer</p>
                                    <button
                                        onClick={handleSkipPrep}
                                        className="mt-4 text-sm text-neutral-400 hover:text-white underline"
                                    >
                                        Start recording now
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Upload overlay */}
                        {currentState?.phase === 'uploading' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
                                    <p className="text-neutral-300">Uploading your response...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recording controls */}
                    {currentState?.phase === 'recording' && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                    Time remaining: <span className="text-white">{formatTime(recordTimeLeft)}</span>
                                </span>
                            </div>
                            <button
                                onClick={handleStopRecording}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Stop Recording
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Question + controls */}
                <div className="lg:w-1/2 flex flex-col gap-6">
                    {/* Question card */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                                Question {currentIndex + 1}
                            </span>
                            <span className="text-xs text-neutral-500">
                                • {currentQuestion?.answerSeconds ? formatTime(currentQuestion.answerSeconds) : '3:00'} max
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold leading-relaxed mb-6">
                            {currentQuestion?.text}
                        </h2>

                        {/* Phase-specific instructions */}
                        {currentState?.phase === 'idle' && (
                            <div className="space-y-4">
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    You&apos;ll have <strong className="text-white">{currentQuestion?.prepSeconds || 30} seconds</strong> to prepare
                                    and <strong className="text-white">{formatTime(currentQuestion?.answerSeconds || 180)}</strong> to record your answer.
                                </p>
                                <button
                                    onClick={startPrep}
                                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Video className="w-5 h-5" />
                                    Begin Question
                                </button>
                            </div>
                        )}

                        {currentState?.phase === 'preparing' && (
                            <p className="text-neutral-400 text-sm">
                                Take a moment to organize your thoughts. Recording will start automatically
                                or you can start early.
                            </p>
                        )}

                        {currentState?.phase === 'recording' && (
                            <p className="text-neutral-400 text-sm">
                                🔴 Recording in progress. Speak clearly and look at the camera.
                                Click &ldquo;Stop Recording&rdquo; when you&apos;re done.
                            </p>
                        )}

                        {currentState?.phase === 'uploaded' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Response saved successfully!</span>
                                </div>
                                <p className="text-neutral-400 text-sm">
                                    Duration: {formatTime(currentState.recordingDuration)}
                                </p>
                                {!isLastQuestion ? (
                                    <button
                                        onClick={handleNextQuestion}
                                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        Next Question
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleComplete}
                                        disabled={isCompleting}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCompleting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Completing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Complete Interview
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {currentState?.phase === 'failed' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="font-medium">Upload failed</span>
                                </div>
                                <p className="text-neutral-400 text-sm">{currentState.error}</p>
                                <button
                                    onClick={startPrep}
                                    className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Retry This Question
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Question navigator */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Questions</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {questions.map((q, i) => {
                                const state = questionStates[i]
                                return (
                                    <div
                                        key={q.id}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${i === currentIndex ? 'bg-neutral-800 text-white' : 'text-neutral-500' }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${state?.phase === 'uploaded' ? 'bg-green-500/20 text-green-400' : state?.phase === 'failed' ? 'bg-red-500/20 text-red-400' : i === currentIndex ? 'bg-orange-500/20 text-orange-400' : 'bg-neutral-800 text-neutral-600' }`}>
                                            {state?.phase === 'uploaded' ? '✓' : state?.phase === 'failed' ? '!' : i + 1}
                                        </div>
                                        <span className="truncate">{q.text}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
