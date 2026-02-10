"use client"

/**
 * useMediaRecorder — React hook for camera/mic recording
 * 
 * Manages MediaRecorder lifecycle for per-question video capture:
 * - Requests camera + mic permissions
 * - Records video as webm/mp4 blob
 * - Exposes start/stop/blob/error
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseMediaRecorderOptions {
    video?: boolean
    audio?: boolean
    mimeType?: string
}

interface UseMediaRecorderReturn {
    /** Start recording */
    start: () => Promise<void>
    /** Stop recording and return blob */
    stop: () => void
    /** Recorded blob (available after stop) */
    blob: Blob | null
    /** Whether currently recording */
    isRecording: boolean
    /** Whether permissions have been granted */
    hasPermission: boolean
    /** Live MediaStream for video preview */
    stream: MediaStream | null
    /** Current error message */
    error: string | null
    /** Request permissions without starting recording */
    requestPermission: () => Promise<boolean>
    /** Reset blob to null for next recording */
    reset: () => void
    /** Recording duration in seconds */
    duration: number
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
    const { video = true, audio = true, mimeType: preferredMimeType } = options

    const [isRecording, setIsRecording] = useState(false)
    const [hasPermission, setHasPermission] = useState(false)
    const [blob, setBlob] = useState<Blob | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [duration, setDuration] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const startTimeRef = useRef<number>(0)
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Determine best available mimeType
    const getMimeType = useCallback(() => {
        if (preferredMimeType && MediaRecorder.isTypeSupported(preferredMimeType)) {
            return preferredMimeType
        }
        const candidates = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
        ]
        return candidates.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'
    }, [preferredMimeType])

    // Request permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            setError(null)
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video, audio })
            setStream(mediaStream)
            setHasPermission(true)
            return true
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Camera/microphone access denied'
            setError(message)
            setHasPermission(false)
            return false
        }
    }, [video, audio])

    // Start recording
    const start = useCallback(async () => {
        setError(null)
        setBlob(null)
        chunksRef.current = []
        setDuration(0)

        let mediaStream = stream
        if (!mediaStream) {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video, audio })
                setStream(mediaStream)
                setHasPermission(true)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to access camera/microphone')
                return
            }
        }

        const selectedMimeType = getMimeType()
        try {
            const recorder = new MediaRecorder(mediaStream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 2_500_000, // 2.5 Mbps
            })

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            recorder.onstop = () => {
                const recordedBlob = new Blob(chunksRef.current, { type: selectedMimeType })
                setBlob(recordedBlob)
                setIsRecording(false)
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current)
                    durationIntervalRef.current = null
                }
            }

            recorder.onerror = () => {
                setError('Recording error occurred')
                setIsRecording(false)
            }

            recorder.start(1000) // Collect data every second
            mediaRecorderRef.current = recorder
            startTimeRef.current = Date.now()
            setIsRecording(true)

            // Update duration every second
            durationIntervalRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
            }, 1000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start recording')
        }
    }, [stream, video, audio, getMimeType])

    // Stop recording
    const stop = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
    }, [])

    // Reset blob
    const reset = useCallback(() => {
        setBlob(null)
        chunksRef.current = []
        setDuration(0)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current)
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
            }
            // Don't stop stream here — let the parent component manage it
        }
    }, [])

    return {
        start,
        stop,
        blob,
        isRecording,
        hasPermission,
        stream,
        error,
        requestPermission,
        reset,
        duration,
    }
}
