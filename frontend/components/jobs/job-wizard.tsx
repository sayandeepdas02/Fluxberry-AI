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

export function JobWizard() {
    const [step, setStep] = useState(1)
    const [data, setData] = useState<JobData>(initialData)
    const [isLoading, setIsLoading] = useState(false)
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
                body: JSON.stringify({ ...data, status }),
            })

            if (!res.ok) throw new Error("Failed to create job")

            const job = await res.json()
            router.push(`/dashboard/jobs`)
        } catch (error) {
            console.error(error)
            alert("Something went wrong.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="mb-10 relative">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex justify-between items-center max-w-2xl mx-auto">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full text-[15px] font-semibold transition-all duration-300 shadow-sm",
                                    step > s ? "bg-red-600 text-white border-2 border-red-600 ring-4 ring-red-50" : 
                                    step === s ? "bg-gradient-to-br from-orange-500 to-red-600 text-white border-2 border-white ring-4 ring-red-100 scale-110" : 
                                    "bg-white text-slate-400 border-2 border-slate-200"
                                )}
                            >
                                {s}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Job Details"}
                        {step === 2 && "Application Form"}
                        {step === 3 && "MCQ Test Configuration"}
                        {step === 4 && "Review & Publish"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {step === 1 && <Step1Details data={data} updateData={updateData} />}
                    {step === 2 && <Step2FormBuilder data={data} updateData={updateData} />}
                    {step === 3 && <Step3MCQ data={data} updateData={updateData} />}
                    {step === 4 && <Step4Review data={data} submitJob={submitJob} isLoading={isLoading} />}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-slate-100 bg-slate-50/50 rounded-b-xl px-8 py-5">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1 || isLoading} className="h-[44px] px-6">
                        Back
                    </Button>
                    {step < 4 ? (
                        <Button variant="gradient" onClick={nextStep} className="h-[44px] px-8 text-[15px]">Next Step</Button>
                    ) : (
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => submitJob("draft")} disabled={isLoading} className="h-[44px] px-6">
                                Save Draft
                            </Button>
                            <Button variant="gradient" onClick={() => submitJob("published")} disabled={isLoading} className="h-[44px] px-8 text-[15px]">
                                Publish Job
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
