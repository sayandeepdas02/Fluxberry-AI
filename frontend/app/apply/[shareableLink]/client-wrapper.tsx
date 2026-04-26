"use client"

import { useState } from "react"
import { ApplicationForm } from "@/components/candidate/application-form"
import { TestInterface } from "@/components/candidate/test-interface"
import { CheckCircle2, AlertCircle, FileCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ClientWrapper({ job }: { job: any }) {
    const [candidateId, setCandidateId] = useState<string | null>(null)
    const [step, setStep] = useState<"form" | "pre-test" | "test" | "complete">("form")

    const onApplicationSubmit = (cId: string) => {
        setCandidateId(cId)
        if (job.testEnabled && job.questions?.length > 0) {
            setStep("pre-test")
        } else {
            setStep("complete")
        }
    }

    const startTest = () => {
        setStep("test")
    }

    const onTestComplete = () => {
        setStep("complete")
    }

    if (step === "complete") {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 px-4 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-[30px] opacity-20 rounded-full" />
                    <div className="relative h-24 w-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl ring-8 ring-emerald-50">
                        <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">Application Complete!</h2>
                    <p className="text-[16px] text-slate-500 max-w-md mx-auto leading-relaxed">
                        Thank you for applying. We have received your application and will review it shortly. You can now safely close this window.
                    </p>
                </div>
            </div>
        )
    }

    if (step === "pre-test") {
        return (
            <div className="max-w-xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-200 rounded-[24px] p-8 sm:p-10 shadow-xl shadow-slate-200/40 text-center space-y-8">
                    <div className="mx-auto h-20 w-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                        <FileCheck className="h-10 w-10" />
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-[24px] font-bold text-slate-900 leading-tight">Application Submitted</h2>
                        <p className="text-[15px] text-slate-600 max-w-sm mx-auto">
                            Great! Before we finish, please complete a short skill assessment for this role.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-5 text-left flex gap-4 shadow-sm">
                        <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="font-bold text-amber-900">Important Instructions</h4>
                            <p className="text-[13px] font-medium text-amber-800/90 leading-relaxed">
                                Once started, you cannot pause the timer. <strong className="text-amber-900">Do not leave the tab or switch windows</strong>, as this will result in automatic submission.
                            </p>
                        </div>
                    </div>

                    <Button onClick={startTest} className="w-full h-14 rounded-full text-[16px] font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        Start Assessment Now <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        )
    }

    if (step === "test" && candidateId) {
        return (
            <TestInterface
                jobId={job.id || job._id}
                candidateId={candidateId}
                duration={job.testDuration || 30}
                onComplete={onTestComplete}
            />
        )
    }

    return (
        <ApplicationForm
            job={job}
            onSuccess={onApplicationSubmit}
        />
    )
}
