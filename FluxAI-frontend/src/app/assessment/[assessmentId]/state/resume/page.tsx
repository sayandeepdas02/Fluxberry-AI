"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { PlayCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function AssessmentResumePage({ params }: { params: Promise<{ assessmentId: string }> }) {
    const { assessmentId } = use(params)
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
                        <PlayCircle className="w-8 h-8" />
                    </div>

                    <div>
                        <h1 className="text-xl text-neutral-900 mb-2">Resume Assessment</h1>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Welcome back! It looks like you have an assessment in progress. You can pick up exactly where you left off.
                        </p>
                    </div>

                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100 flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Time Remaining</span>
                        <span className="font-medium text-neutral-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-neutral-400" />
                            24:12
                        </span>
                    </div>

                    <Button size="lg" className="w-full" asChild>
                        <Link href={`/assessment/${assessmentId}/round/1`}>
                            Continue Assessment
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
