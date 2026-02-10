"use client"

/**
 * AI Interview Pre-Interview Screen
 * 
 * Permission check, consent, and interview preparation.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Mic, AlertCircle, CheckCircle2, Shield } from 'lucide-react'

interface PreInterviewScreenProps {
    assessmentTitle: string
    agentType: string
    durationMinutes: number
    onStartInterview: () => void
    onCancel: () => void
}

export function PreInterviewScreen({
    assessmentTitle,
    agentType,
    durationMinutes,
    onStartInterview,
    onCancel,
}: PreInterviewScreenProps) {
    const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
    const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
    const [consentChecked, setConsentChecked] = useState(false)

    useEffect(() => {
        checkPermissions()
        return () => {
            // Cleanup video stream on unmount
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const checkPermissions = async () => {
        try {
            // Request camera and microphone
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            })

            setVideoStream(stream)
            setCameraPermission('granted')
            setMicPermission('granted')
        } catch (error) {
            console.error('Permission denied:', error)
            if ((error as DOMException).name === 'NotAllowedError') {
                setCameraPermission('denied')
                setMicPermission('denied')
            }
        }
    }

    const retryPermissions = () => {
        setCameraPermission('pending')
        setMicPermission('pending')
        checkPermissions()
    }

    const canStart = cameraPermission === 'granted' && micPermission === 'granted' && consentChecked

    const agentTypeLabels: Record<string, string> = {
        FRONTEND_ENGINEER: 'Frontend Engineering',
        BACKEND_ENGINEER: 'Backend Engineering',
        HR_GENERAL: 'Culture & Communication',
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
            {/* Header */}
            <div className="border-b border-neutral-800 p-4">
                <h1 className="text-xl font-semibold">{assessmentTitle}</h1>
                <p className="text-sm text-neutral-400">AI Technical Interview</p>
            </div>

            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-2xl w-full space-y-8">
                    {/* Interview Info */}
                    <div className="text-center space-y-3 mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold">Prepare for Your AI Interview</h2>
                        <p className="text-neutral-400 text-sm md:text-base">
                            You will be interviewed by an AI {agentTypeLabels[agentType] || agentType} interviewer.
                        </p>
                        <p className="text-neutral-400 text-sm md:text-base">
                            Duration: approximately <span className="text-white font-medium">{durationMinutes} minutes</span>
                        </p>
                    </div>

                    {/* Video Preview */}
                    <div className="relative aspect-video max-w-lg mx-auto bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-neutral-800">
                        {videoStream ? (
                            <video
                                autoPlay
                                muted
                                playsInline
                                ref={(el) => {
                                    if (el) el.srcObject = videoStream
                                }}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-neutral-500">
                                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Camera preview will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Permission Status */}
                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                        <PermissionCard
                            icon={Camera}
                            label="Camera"
                            status={cameraPermission}
                        />
                        <PermissionCard
                            icon={Mic}
                            label="Microphone"
                            status={micPermission}
                        />
                    </div>

                    {(cameraPermission === 'denied' || micPermission === 'denied') && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-red-400 font-medium">Permissions Required</p>
                                    <p className="text-sm text-neutral-400 mt-1">
                                        Please enable camera and microphone access in your browser settings to continue.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={retryPermissions}
                                    >
                                        Retry Permissions
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Consent */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-lg mx-auto">
                        <label className="flex items-start gap-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-neutral-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-neutral-900"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-orange-500" />
                                    Recording Consent
                                </p>
                                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                                    I understand that this interview will be recorded (audio and video) for review by the hiring team.
                                    The recording will be stored securely and used solely for evaluation purposes.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="px-8 py-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onStartInterview}
                            disabled={!canStart}
                            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Interview
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PermissionCard({
    icon: Icon,
    label,
    status,
}: {
    icon: typeof Camera
    label: string
    status: 'pending' | 'granted' | 'denied'
}) {
    return (
        <div className={`
            flex items-center gap-3 p-4 rounded-lg border
            ${status === 'granted' ? 'bg-green-500/10 border-green-500/20' :
                status === 'denied' ? 'bg-red-500/10 border-red-500/20' :
                    'bg-neutral-900 border-neutral-800'}
        `}>
            <Icon className={`w-5 h-5 ${status === 'granted' ? 'text-green-500' :
                status === 'denied' ? 'text-red-500' :
                    'text-neutral-400'
                }`} />
            <span className="text-sm font-medium">{label}</span>
            {status === 'granted' && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
            )}
            {status === 'denied' && (
                <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
            )}
        </div>
    )
}
