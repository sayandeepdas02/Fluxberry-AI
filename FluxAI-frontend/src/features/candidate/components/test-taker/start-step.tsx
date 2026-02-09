"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldAlert, Play, Loader2, AlertCircle } from "lucide-react"
import { attemptsApi } from "@/lib/api/attempts"
import { setAttemptId, setRoundTypes, setCandidateId, setCandidateName } from "@/features/candidate/lib/attempt-storage"

export function StartStep({ assessmentId }: { assessmentId: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailFromUrl = searchParams.get("email")?.trim() ?? ""

    const [name, setName] = useState("")
    const [email, setEmail] = useState(emailFromUrl)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (emailFromUrl) setEmail(emailFromUrl)
    }, [emailFromUrl])

    const handleStart = async () => {
        const trimmedEmail = email.trim().toLowerCase()
        const trimmedName = name.trim()

        if (!trimmedEmail) {
            setError("Please enter your email address.")
            return
        }
        if (!trimmedName) {
            setError("Please enter your full name.")
            return
        }

        setError(null)
        setLoading(true)

        // rudimentary split
        const nameParts = trimmedName.split(' ')
        const firstName = nameParts[0]
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

        try {
            const res = await attemptsApi.startOrResume(assessmentId, {
                candidateEmail: trimmedEmail,
                candidateFirstName: firstName,
                candidateLastName: lastName
            })
            if (res.success && res.data) {
                const attempt = res.data as { id: string; candidateId: string; rounds: { roundType: string }[] }
                setAttemptId(assessmentId, attempt.id)
                setCandidateId(assessmentId, attempt.candidateId)
                setCandidateName(assessmentId, trimmedName)
                setRoundTypes(
                    assessmentId,
                    attempt.rounds.map((r) => r.roundType)
                )
                router.push(`/assessment/${assessmentId}/system-check`)
                return
            }
            setError(res.error?.message ?? "Could not start assessment. Try again.")
        } catch {
            setError("Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">

                <div className="border-b border-neutral-100 p-8 text-center bg-white">
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">F</span>
                            </div>
                            <span className="font-semibold text-neutral-900">Flux AI</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
                        Assessment
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Enter your details to begin the assessment.
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Jane Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center">Rounds</div>
                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100 items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold font-mono">1</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-neutral-900 text-sm">Technical MCQ</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">Multiple choice</p>
                            </div>
                            <Badge variant="outline" className="bg-white">Technical</Badge>
                        </div>
                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100 items-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold font-mono">2</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-neutral-900 text-sm">Hands-on Coding</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">DSA</p>
                            </div>
                            <Badge variant="outline" className="bg-white">Practical</Badge>
                        </div>
                        <div className="flex gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-100 items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold font-mono">3</div>
                            <div className="flex-1">
                                <h4 className="font-medium text-neutral-900 text-sm">AI Video Interview</h4>
                                <p className="text-xs text-neutral-500 mt-0.5">Behavioral</p>
                            </div>
                            <Badge variant="outline" className="bg-white">Behavioral</Badge>
                        </div>
                    </div>

                    <div className="bg-amber-50 text-amber-900 p-4 rounded-lg text-sm border border-amber-100 flex gap-3 items-start">
                        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold">Proctoring Enabled</p>
                            <p className="opacity-90 text-xs leading-relaxed">
                                This assessment may monitor full-screen activity and use your camera and microphone.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-center">
                        <Button
                            size="lg"
                            className="w-full md:w-auto px-12 h-12 text-base shadow-sm group"
                            onClick={handleStart}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…
                                </>
                            ) : (
                                <>
                                    Start Assessment <Play className="w-4 h-4 ml-2 fill-current opacity-60 group-hover:opacity-100 transition-opacity" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-neutral-50 p-4 text-center text-xs text-neutral-400 border-t border-neutral-100">
                    Powered by FluxAI • Privacy Policy • Terms of Service
                </div>
            </div>
        </div>
    )
}
