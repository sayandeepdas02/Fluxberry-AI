"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Clock, Code2, FileText, Video, AlertCircle, Share2, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function AssessmentReview({ assessmentId }: { assessmentId: string }) {
    const router = useRouter()
    const [isPublished, setIsPublished] = useState(false)

    // Mock Configuration Data (simulating what was set in Configure step)
    const config = {
        title: "Senior Frontend Engineer Assessment",
        role: "Senior Frontend Engineer",
        rounds: [
            { id: "mcq", title: "Technical MCQ", type: "mcq", enabled: true, details: "Custom Selection: 30 Questions" },
            { id: "dsa", title: "Hands-on Coding", type: "dsa", enabled: true, details: "4 Problems: 1 Easy, 2 Medium, 1 Hard" },
            { id: "ai", title: "AI Video Interview", type: "ai", enabled: true, details: "Agent: Backend Specialist" }
        ]
    }

    const handlePublish = () => {
        setIsPublished(true)
        // Simulate API call and redirect
        setTimeout(() => {
            router.push(`/dashboard/assessments/${assessmentId}/invite?published=true`)
        }, 1000)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/assessments/${assessmentId}/configure`}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl tracking-tight">Review & Publish</h1>
                    <p className="text-sm text-neutral-500">Final check before activating this assessment.</p>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-sm text-blue-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>
                    Once published, the assessment configuration will be <span className="">locked</span> and cannot be edited.
                    This ensures consistency for all candidates.
                </p>
            </div>

            <div className="space-y-6">

                {/* General Info */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base font-semibold">Assessment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-neutral-500 block mb-1">Assessment Name</span>
                            <span className="font-medium">{config.title}</span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-1">Linked Role</span>
                            <span className="font-medium text-neutral-900 flex items-center gap-2">
                                {config.role}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Round Summary */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-base font-semibold">Round Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {config.rounds.map((round) => (
                            <div key={round.id} className={cn("flex items-start gap-4 p-3 rounded-lg border", round.enabled ? "bg-white border-neutral-200" : "bg-neutral-50 border-neutral-100 opacity-60")}>
                                <div className={cn("mt-0.5 p-2 rounded-lg",
                                    round.type === 'mcq' ? "bg-blue-100 text-blue-600" :
                                        round.type === 'dsa' ? "bg-green-100 text-green-600" :
                                            "bg-purple-100 text-purple-600"
                                )}>
                                    {round.type === 'mcq' && <FileText className="w-4 h-4" />}
                                    {round.type === 'dsa' && <Code2 className="w-4 h-4" />}
                                    {round.type === 'ai' && <Video className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-sm text-neutral-900">{round.title}</h4>
                                        {round.enabled ? (
                                            <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200 border">Enabled</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-neutral-400">Disabled</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500">{round.details}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 gap-4 border-t border-neutral-100 mt-8">
                <Button variant="ghost" asChild>
                    <Link href={`/dashboard/assessments/${assessmentId}/configure`}>Back to Edit</Link>
                </Button>
                <Button
                    size="lg"
                    className={cn("gap-2 min-w-[200px]", isPublished ? "bg-green-600 hover:bg-green-700" : "bg-neutral-900 hover:bg-neutral-800")}
                    onClick={handlePublish}
                    disabled={isPublished}
                >
                    {isPublished ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" /> Published!
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" /> Publish Assessment
                        </>
                    )}
                </Button>
            </div>

        </div>
    )
}
