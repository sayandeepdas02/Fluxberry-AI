"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Home } from "lucide-react"
import Link from "next/link"

export function AlreadyCompleted() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 mb-2">Already Submitted</h1>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Our records show that you have already completed and submitted this assessment.
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
                        <p className="font-medium">Submission Received</p>
                        <p className="opacity-80 mt-1">Jan 29, 2026 at 2:30 PM</p>
                    </div>

                    <p className="text-neutral-400 text-xs">
                        If you need to update your information, please reach out to the hiring manager directly.
                    </p>

                    <Button size="lg" variant="outline" className="w-full gap-2" asChild>
                        <Link href="/">
                            <Home className="w-4 h-4" /> Return Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
