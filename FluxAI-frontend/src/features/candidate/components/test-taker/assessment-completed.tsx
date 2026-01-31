"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export function AssessmentCompleted() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md text-center space-y-8">

                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-in zoom-in-50 duration-500">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Assessment Submitted!</h1>
                    <p className="text-neutral-500 leading-relaxed">
                        Thank you for completing the assessment. Your responses have been securely recorded and sent to the hiring team.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 text-left space-y-4">
                    <h3 className="font-semibold text-neutral-900 text-sm">What happens next?</h3>
                    <ul className="space-y-3 text-sm text-neutral-600">
                        <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-500 flex-shrink-0">1</span>
                            <span>The hiring team will review your results.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-500 flex-shrink-0">2</span>
                            <span>You will be notified via email about the next steps within 2-3 business days.</span>
                        </li>
                    </ul>
                </div>

                <Button variant="outline" className="w-full" asChild>
                    <Link href="/">
                        Return to Home Page
                    </Link>
                </Button>

            </div>
        </div>
    )
}
