"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Camera, Mic, Monitor, Wifi, Loader2, ArrowRight, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getAttemptId } from "@/features/candidate/lib/attempt-storage"

export function SystemCheckStep({ assessmentId }: { assessmentId: string }) {
    const router = useRouter()
    const [checking, setChecking] = useState(false)
    const [checks, setChecks] = useState({
        camera: false,
        mic: false,
        screen: false,
        network: false
    })
    const [error, setError] = useState<string | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [consent, setConsent] = useState(false)

    useEffect(() => {
        if (!getAttemptId(assessmentId)) {
            router.replace(`/assessment/${assessmentId}/start`)
            return
        }
    }, [assessmentId, router])

    useEffect(() => {
        // Cleanup stream on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop())
            }
        }
    }, [stream])

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    const startChecks = async () => {
        setChecking(true)
        setError(null)
        try {
            // 1. Network Check
            const online = navigator.onLine
            setChecks(c => ({ ...c, network: online }))
            if (!online) throw new Error("No internet connection detected.")

            // 2. Screen Check
            const fullscreenSupported = document.fullscreenEnabled
            setChecks(c => ({ ...c, screen: fullscreenSupported }))
            if (!fullscreenSupported) throw new Error("Fullscreen mode is not supported by your browser.")

            // 3. Media Check
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            setStream(mediaStream)
            setChecks(c => ({ ...c, camera: true, mic: true })) // Assume success if stream obtained

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "System check failed. Please ensure camera/mic permissions are allowed.")
        } finally {
            setChecking(false)
        }
    }

    // Auto-start checks on mount? Maybe not, better to let user click "Start Check" or auto-start.
    // Let's auto-start for smooth UX, but handle errors gracefully.
    useEffect(() => {
        startChecks()
    }, [])

    const allPassed = checks.camera && checks.mic && checks.screen && checks.network

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">

                <div className="p-8 border-b border-neutral-100 text-center">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">System Capability Check</h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        We need to verify your environment before proceeding.
                    </p>
                </div>

                <div className="p-8 space-y-6">

                    {/* Camera Preview */}
                    <div className="bg-neutral-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden group">
                        {stream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ) : error ? (
                            <div className="flex flex-col items-center gap-2 text-red-400 p-4 text-center">
                                <AlertTriangle className="w-8 h-8" />
                                <span className="text-xs">{error}</span>
                                <Button variant="outline" size="sm" onClick={startChecks} className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">Retry</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-neutral-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-xs">Requesting permissions...</span>
                            </div>
                        )}

                        {stream && (
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium border border-green-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                LIVE
                            </div>
                        )}
                    </div>

                    {/* Check List */}
                    <div className="space-y-3">
                        <CheckItem label="Camera connected" icon={Camera} status={checking ? 'loading' : checks.camera ? 'success' : 'error'} />
                        <CheckItem label="Microphone connected" icon={Mic} status={checking ? 'loading' : checks.mic ? 'success' : 'error'} />
                        <CheckItem label="Fullscreen supported" icon={Monitor} status={checking ? 'loading' : checks.screen ? 'success' : 'error'} />
                        <CheckItem label="Stable internet connection" icon={Wifi} status={checking ? 'loading' : checks.network ? 'success' : 'error'} />
                    </div>

                    {/* Consent */}
                    <div className="pt-4 border-t border-neutral-100">
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="terms"
                                checked={consent}
                                onCheckedChange={(c) => setConsent(c as boolean)}
                                disabled={checking || !allPassed}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I agree to proctoring and monitoring
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    I understand my screen, camera, and microphone will be recorded for the duration of this assessment.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full h-12 text-base shadow-sm"
                        disabled={checking || !consent || !allPassed}
                        asChild={!checking && consent && allPassed}
                    >
                        {(!checking && consent && allPassed) ? (
                            <Link href={`/assessment/${assessmentId}/identity-check`}>
                                Proceed to Identity Check <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        ) : (
                            <span className="flex items-center gap-2">
                                Proceed to Identity Check <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>

                </div>
            </div>
        </div>
    )
}

function CheckItem({ label, icon: Icon, status }: { label: string, icon: any, status: 'loading' | 'success' | 'error' }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-neutral-700">{label}</span>
            </div>
            {status === 'loading' && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {status === 'error' && <div className="text-xs text-red-500 font-medium">Failed</div>}
        </div>
    )
}
