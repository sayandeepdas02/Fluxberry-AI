"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Step1Details } from "./steps/step-1-details"
import { Step2FormBuilder } from "./steps/step-2-form-builder"
import { Step3MCQ } from "./steps/step-3-mcq"
import { Step4Review } from "./steps/step-4-review"
import { cn } from "@/lib/utils"
import { Check, Copy, ExternalLink, Sparkles, Send } from "lucide-react"

export type JobData = {
    title: string
    description: string
    roleType: string
    experienceLevel: string
    location: string
    customFields: { name: string; type: string; required: boolean }[]
    testEnabled: boolean
    testDuration: number
    passingScore: number
    questions: {
        text: string
        options: string[]
        correctAnswer: string
    }[]
}

const initialData: JobData = {
    title: "",
    description: "",
    roleType: "",
    experienceLevel: "",
    location: "",
    customFields: [],
    testEnabled: false,
    testDuration: 30,
    passingScore: 70,
    questions: [],
}

const STEP_LABELS = ["Job Details", "Application Form", "MCQ Assessment", "Review & Publish"]

export function JobWizard() {
    const [step, setStep] = useState(1)
    const [data, setData] = useState<JobData>(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const [publishedLink, setPublishedLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const router = useRouter()

    const updateData = (newData: Partial<JobData>) => {
        setData((prev) => ({ ...prev, ...newData }))
    }

    const nextStep = () => setStep((prev) => prev + 1)
    const prevStep = () => setStep((prev) => prev - 1)

    const submitJob = async (status: "draft" | "published") => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, status }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to create job")
            }

            const job = await res.json()

            if (status === "published" && job.shareableLink) {
                setPublishedLink(job.shareableLink)
            } else {
                router.push(`/dashboard/jobs`)
            }
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Something went wrong.")
        } finally {
            setIsLoading(false)
        }
    }

    const copyLink = () => {
        if (!publishedLink) return
        const url = `${window.location.origin}/apply/${publishedLink}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ── Published success screen ──────────────────────────────────────────────
    if (publishedLink) {
        const applyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/apply/${publishedLink}`
        return (
            <div className="max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
                <Card className="text-center overflow-hidden border-0 shadow-2xl shadow-emerald-900/5">
                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-700 p-12 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                        <div className="relative z-10 mx-auto h-20 w-20 bg-white/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-white/30 backdrop-blur-md shadow-lg shadow-emerald-900/20">
                            <Sparkles className="h-10 w-10 text-white" strokeWidth={2} />
                        </div>
                        <h2 className="relative z-10 text-3xl font-extrabold text-white tracking-tight">Job Published!</h2>
                        <p className="relative z-10 text-emerald-100/90 mt-3 text-[16px] max-w-md mx-auto leading-relaxed">Your job post is live and ready to receive applications. Share the link below to get started.</p>
                    </div>
                    <CardContent className="py-10 space-y-8 bg-white">
                        <div className="space-y-3 max-w-md mx-auto">
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Shareable Apply Link</p>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[12px] p-2 pl-4 shadow-sm hover:border-slate-300 transition-colors">
                                <span className="flex-1 text-[14px] text-slate-600 truncate font-mono text-left">{applyUrl}</span>
                                <Button size="default" className="shrink-0 rounded-[8px] px-6 h-10 shadow-sm" onClick={copyLink}>
                                    {copied
                                        ? <><Check className="h-4 w-4 text-emerald-300 mr-2" /> Copied!</>
                                        : <><Copy className="h-4 w-4 mr-2" /> Copy Link</>
                                    }
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-4 border-t border-slate-100 bg-slate-50/50 px-8 py-6 justify-center">
                        <Button variant="outline" className="w-[200px] h-11 rounded-full text-slate-600" onClick={() => window.open(applyUrl, "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-2" /> Preview Post
                        </Button>
                        <Button className="w-[200px] h-11 rounded-full shadow-md" onClick={() => router.push("/dashboard/jobs")}>
                            Go to Dashboard →
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-[800px] mx-auto w-full">
            {/* Step indicator */}
            <div className="mb-12 relative">
                <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 pointer-events-none rounded-full" />
                <div className="absolute top-5 left-0 h-[2px] bg-slate-900 pointer-events-none rounded-full transition-all duration-500 ease-out" style={{ width: `${((step - 1) / 3) * 100}%` }} />
                
                <div className="relative z-10 flex justify-between items-start max-w-2xl mx-auto">
                    {[1, 2, 3, 4].map((s) => {
                        const isCompleted = step > s;
                        const isCurrent = step === s;
                        return (
                            <div key={s} className="flex flex-col items-center gap-3 bg-white px-2">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full text-[14px] font-bold transition-all duration-500",
                                        isCompleted
                                            ? "bg-slate-900 text-white shadow-md ring-4 ring-slate-100"
                                            : isCurrent
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 ring-4 ring-primary/10 scale-110"
                                                : "bg-white text-slate-400 border-2 border-slate-200"
                                    )}
                                >
                                    {isCompleted ? <Check className="h-5 w-5" strokeWidth={3} /> : s}
                                </div>
                                <span className={cn(
                                    "text-[12px] font-semibold text-center max-w-[80px] leading-tight transition-colors duration-300",
                                    isCurrent ? "text-primary" : isCompleted ? "text-slate-700" : "text-slate-400"
                                )}>
                                    {STEP_LABELS[s - 1]}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[20px] overflow-hidden bg-white">
                <CardContent className="p-8 sm:p-10">
                    {step === 1 && <Step1Details data={data} updateData={updateData} />}
                    {step === 2 && <Step2FormBuilder data={data} updateData={updateData} />}
                    {step === 3 && <Step3MCQ data={data} updateData={updateData} />}
                    {step === 4 && <Step4Review data={data} submitJob={submitJob} isLoading={isLoading} />}
                </CardContent>
                <div className="flex justify-between items-center border-t border-slate-100 bg-slate-50/50 px-8 py-5">
                    <Button 
                        variant="outline" 
                        onClick={prevStep} 
                        disabled={step === 1 || isLoading} 
                        className="h-11 px-6 rounded-full font-medium"
                    >
                        ← Back
                    </Button>
                    
                    {step < 4 ? (
                        <Button 
                            onClick={nextStep} 
                            className="h-11 px-8 rounded-full font-semibold shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Next Step →
                        </Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => submitJob("draft")} 
                                disabled={isLoading} 
                                className="h-11 px-6 rounded-full font-medium bg-white"
                            >
                                {isLoading ? "Saving..." : "Save Draft"}
                            </Button>
                            <Button 
                                onClick={() => submitJob("published")} 
                                disabled={isLoading} 
                                className="h-11 px-8 rounded-full font-semibold shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? "Publishing..." : <><Send className="w-4 h-4 mr-2"/> Publish Job</>}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
