"use client"

/**
 * useSilenceDetection — 5-second silence gate
 *
 * Monitors a MediaStream using the Web Audio API's AnalyserNode.
 * Fires onSilenceDetected() after 5 continuous seconds below the RMS threshold.
 * Resets immediately on any speech above the threshold.
 *
 * CRITICAL: silence window is exactly 5000ms (not 2s).
 */

import { useEffect, useRef, useCallback } from "react"

const SILENCE_DURATION_MS = 5_000  // 5 seconds — DO NOT CHANGE
const RMS_THRESHOLD = 0.01          // amplitude threshold for "speech"
const SAMPLE_INTERVAL_MS = 100      // check every 100ms (50 checks over 5s window)

interface UseSilenceDetectionOptions {
    stream: MediaStream | null
    enabled: boolean
    onSilenceDetected: () => void
    onSpeechStart?: () => void
}

// Compute RMS energy of a Float32Array audio buffer
function computeRMS(data: Float32Array): number {
    let sum = 0
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i]
    }
    return Math.sqrt(sum / data.length)
}

export function useSilenceDetection({
    stream,
    enabled,
    onSilenceDetected,
    onSpeechStart,
}: UseSilenceDetectionOptions): { currentLevel: React.MutableRefObject<number> } {
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const silenceStartRef = useRef<number | null>(null)
    const isSpeakingRef = useRef(false)
    const firedRef = useRef(false)  // don't fire multiple times per silence window
    const currentLevelRef = useRef(0)

    const stopMonitoring = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        sourceRef.current?.disconnect()
        analyserRef.current?.disconnect()
        audioContextRef.current?.close().catch(() => { })
        audioContextRef.current = null
        analyserRef.current = null
        sourceRef.current = null
        silenceStartRef.current = null
        isSpeakingRef.current = false
        firedRef.current = false
    }, [])

    useEffect(() => {
        if (!stream || !enabled) {
            stopMonitoring()
            return
        }

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) return

        const ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.3
        const source = ctx.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = ctx
        analyserRef.current = analyser
        sourceRef.current = source

        const buffer = new Float32Array(analyser.fftSize)

        intervalRef.current = setInterval(() => {
            if (!analyserRef.current) return

            analyserRef.current.getFloatTimeDomainData(buffer)
            const rms = computeRMS(buffer)
            currentLevelRef.current = rms

            const isSpeech = rms > RMS_THRESHOLD

            if (isSpeech) {
                // Speech detected — reset silence timer
                if (!isSpeakingRef.current) {
                    onSpeechStart?.()
                }
                isSpeakingRef.current = true
                silenceStartRef.current = null
                firedRef.current = false
            } else {
                // Silence — start or continue timing
                isSpeakingRef.current = false
                if (silenceStartRef.current === null) {
                    silenceStartRef.current = Date.now()
                } else if (!firedRef.current) {
                    const silenceDuration = Date.now() - silenceStartRef.current
                    if (silenceDuration >= SILENCE_DURATION_MS) {
                        firedRef.current = true
                        onSilenceDetected()
                    }
                }
            }
        }, SAMPLE_INTERVAL_MS)

        return () => stopMonitoring()
    }, [stream, enabled, onSilenceDetected, onSpeechStart, stopMonitoring])

    return { currentLevel: currentLevelRef }
}
