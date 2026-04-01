"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, FileText, Upload, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getAttemptId, getCandidateName, getCandidateId } from "@/features/candidate/lib/attempt-storage"
import { attemptsApi } from "@/lib/api/attempts"

export function IdentityCheckStep({ assessmentId }: { assessmentId: string }) {
    const router = useRouter()
    const attemptId = getAttemptId(assessmentId)
    const candidateName = getCandidateName(assessmentId) || "Candidate"

    const [uploading, setUploading] = useState(false)
    const [resumeName, setResumeName] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        setMounted(true)
        if (!getAttemptId(assessmentId)) {
            router.replace(`/assessment/${assessmentId}/start`)
        }
    }, [assessmentId, router])

    useEffect(() => {
        let mounted = true
        async function initCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                if (mounted) setStream(mediaStream)
            } catch (err) {
                console.error("Failed to access camera", err)
            }
        }
        initCamera()
        return () => {
            mounted = false
            if (stream) stream.getTracks().forEach(t => t.stop())
        }
    }, [])

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError("File size must be less than 5MB")
            return
        }
        if (file.type !== "application/pdf") {
            setError("Only PDF files are allowed")
            return
        }

        setError(null)
        setUploading(true)
        const candidateId = getCandidateId(assessmentId)

        try {
            if (!attemptId || !candidateId) throw new Error("Session invalid")

            await attemptsApi.uploadResume(attemptId, candidateId, assessmentId, file)
            setResumeName(file.name)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Failed to upload resume")
        } finally {
            setUploading(false)
        }
    }

    if (!mounted || !attemptId) return null

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col md:flex-row">

                {/* Left Panel: Camera Preview */}
                <div className="w-full md:w-1/2 bg-neutral-900 p-8 flex flex-col items-center justify-center text-white relative">
                    <div className="bg-neutral-800 w-full aspect-[4/3] rounded-lg flex items-center justify-center border border-neutral-700 relative overflow-hidden">
                        {stream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ) : (
                            <div className="text-neutral-500 text-sm flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                                    <span className="text-xl text-white">{candidateName.charAt(0)}</span>
                                </div>
                                <span>Camera Loading...</span>
                            </div>
                        )}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-50 animate-pulse" />
                            REC
                        </div>
                    </div>
                    <p className="mt-6 text-neutral-400 text-sm text-center">
                        Please ensure your face is clearly visible within the frame.
                    </p>
                </div>

                {/* Right Panel: Verification */}
                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-xl text-neutral-900">Identity Verification</h2>
                        <p className="text-neutral-500 text-sm mt-1">Confirm your details before starting.</p>
                    </div>

                    <div className="space-y-6 flex-1">

                        {/* Name Info */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm shrink-0">
                                {candidateName.charAt(0)}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Candidate Name</label>
                                <p className="font-medium text-neutral-900">{candidateName}</p>
                            </div>
                            <div className="ml-auto">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                        </div>

                        {/* Resume Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-900">Upload Resume (Optional)</label>
                            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors relative">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2 text-neutral-500 relative z-20">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="text-xs font-medium">Uploading...</span>
                                    </div>
                                ) : resumeName ? (
                                    <div className="flex flex-col items-center gap-2 relative z-20">
                                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium text-neutral-900">{resumeName}</p>
                                            <p className="text-xs text-green-600 font-medium">Upload Complete</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative z-20 pointer-events-none">
                                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-2 mx-auto">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm text-neutral-900 font-medium">Click to upload PDF</p>
                                        <p className="text-xs text-neutral-500 mt-1">Max 5MB</p>
                                    </div>
                                )}
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-100">
                        <Button
                            size="lg"
                            className="w-full h-12 text-base"
                            disabled={uploading}
                            asChild={!uploading}
                        >
                            {!uploading ? (
                                <Link href={`/assessment/${assessmentId}/round/0`}>
                                    Confirm & Start Round 1 <ChevronRight className="w-4 h-4 ml-2" />
                                </Link>
                            ) : (
                                <span>Uploading...</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
