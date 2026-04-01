"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function AssessmentExpiredPage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <div>
                        <h1 className="text-xl text-neutral-900 mb-2">Assessment Expired</h1>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            The time window for this assessment has passed. Unfortunately, you can no longer submit responses.
                        </p>
                    </div>

                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 text-sm text-neutral-600 text-left">
                        <p className="font-medium text-neutral-900 mb-1">Think this is a mistake?</p>
                        <p>If you experienced technical issues, please contact the recruiting team immediately.</p>
                    </div>

                    <Button variant="outline" size="lg" className="w-full gap-2" asChild>
                        <Link href="mailto:support@example.com">
                            <Mail className="w-4 h-4" /> Contact Support
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
