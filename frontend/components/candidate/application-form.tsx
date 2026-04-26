"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Upload, CheckCircle2, User, Mail, DollarSign, FileText } from "lucide-react"

export function ApplicationForm({ job, onSuccess }: { job: any; onSuccess: (id: string) => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const onSubmit = async (data: any) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            let parsedResume = null
            if (resumeFile) {
                const fd = new FormData()
                fd.append("file", resumeFile)
                try {
                    const parseRes = await fetch("/api/parse-resume", { method: "POST", body: fd })
                    if (parseRes.ok) {
                        const parsedData = await parseRes.json()
                        parsedResume = parsedData.details
                    }
                } catch {
                    // parse-resume is optional, continue
                }
            }

            // Build custom fields payload
            const customFields: Record<string, any> = {}
            job.customFields?.forEach((field: any) => {
                const key = `custom_${field.fieldName}`
                if (data[key] !== undefined) {
                    customFields[field.fieldName] = data[key]
                }
            })

            const payload = {
                jobId: job.id || job._id,
                name: data.name,
                email: data.email,
                currentCTC: parseFloat(data.currentCTC) || 0,
                expectedCTC: parseFloat(data.expectedCTC) || 0,
                resumeUrl: resumeFile ? `/uploads/${resumeFile.name}` : "",
                parsedResume,
                customFields,
            }

            const res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Submission failed")
            }

            const result = await res.json()
            onSuccess(result.id || result._id?.toString())
        } catch (error: any) {
            console.error(error)
            setSubmitError(error.message || "Failed to submit application. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border-b border-slate-100 pb-6">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Application Form</h3>
                <p className="text-[15px] text-muted-foreground mt-2">Please fill out the details below to apply for the position.</p>
            </div>

            {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-[14px] font-medium leading-relaxed">{submitError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name + Email */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                        <Label htmlFor="name" className="text-[14px] font-semibold text-slate-700">
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                id="name" 
                                {...register("name", { required: "Full name is required" })} 
                                placeholder="John Doe" 
                                className="h-12 pl-10 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 rounded-[12px] text-[15px] transition-all"
                            />
                        </div>
                        {errors.name && <p className="text-[13px] font-medium text-red-500 ml-1">{errors.name.message as string}</p>}
                    </div>
                    <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-[14px] font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                id="email" 
                                type="email" 
                                {...register("email", { required: "Email is required" })} 
                                placeholder="john@example.com" 
                                className="h-12 pl-10 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 rounded-[12px] text-[15px] transition-all"
                            />
                        </div>
                        {errors.email && <p className="text-[13px] font-medium text-red-500 ml-1">{errors.email.message as string}</p>}
                    </div>
                </div>

                {/* CTC */}
                <div className="grid md:grid-cols-2 gap-6 p-6 rounded-[16px] bg-slate-50/50 border border-slate-100">
                    <div className="space-y-2.5">
                        <Label htmlFor="currentCTC" className="text-[14px] font-semibold text-slate-700">
                            Current CTC (LPA) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                id="currentCTC" 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                {...register("currentCTC", { required: "Current CTC is required" })} 
                                placeholder="e.g. 8.5" 
                                className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-primary/20 rounded-[10px] text-[15px] transition-all shadow-sm"
                            />
                        </div>
                        {errors.currentCTC && <p className="text-[13px] font-medium text-red-500 ml-1">{errors.currentCTC.message as string}</p>}
                    </div>
                    <div className="space-y-2.5">
                        <Label htmlFor="expectedCTC" className="text-[14px] font-semibold text-slate-700">
                            Expected CTC (LPA) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                id="expectedCTC" 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                {...register("expectedCTC", { required: "Expected CTC is required" })} 
                                placeholder="e.g. 12" 
                                className="h-11 pl-10 bg-white border-slate-200 focus-visible:ring-primary/20 rounded-[10px] text-[15px] transition-all shadow-sm"
                            />
                        </div>
                        {errors.expectedCTC && <p className="text-[13px] font-medium text-red-500 ml-1">{errors.expectedCTC.message as string}</p>}
                    </div>
                </div>

                {/* Resume Upload */}
                <div className="space-y-2.5">
                    <Label htmlFor="resume" className="text-[14px] font-semibold text-slate-700">
                        Resume (PDF) <span className="text-red-500">*</span>
                    </Label>
                    <div className={`relative flex items-center justify-center flex-col gap-3 border-2 border-dashed rounded-[16px] p-8 transition-all duration-300 ${resumeFile ? "border-emerald-500 bg-emerald-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary/50"}`}>
                        {resumeFile ? (
                            <>
                                <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mb-1">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                                </div>
                                <p className="text-[16px] font-bold text-emerald-800">{resumeFile.name}</p>
                                <p className="text-[13px] font-medium text-emerald-600/80">Click to change file</p>
                            </>
                        ) : (
                            <>
                                <div className="h-14 w-14 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-[16px] font-semibold text-slate-700">Click or drag PDF to upload</p>
                                <p className="text-[13px] text-muted-foreground">Maximum file size: 5MB</p>
                            </>
                        )}
                        <input
                            id="resume"
                            type="file"
                            accept=".pdf"
                            required
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>

                {/* Custom Fields */}
                {job.customFields?.length > 0 && (
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                        <h4 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            Additional Questions
                        </h4>
                        <div className="space-y-5">
                            {job.customFields.map((field: any, i: number) => (
                                <div key={i} className="space-y-2.5">
                                    <Label className="text-[14px] font-semibold text-slate-700">
                                        {field.fieldName} {field.required && <span className="text-red-500">*</span>}
                                    </Label>
                                    {field.fieldType === "textarea" ? (
                                        <textarea
                                            {...register(`custom_${field.fieldName}`, { required: field.required ? `${field.fieldName} is required` : false })}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[12px] text-[15px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-sm"
                                            placeholder="Enter your answer..."
                                        />
                                    ) : (
                                        <Input
                                            type={field.fieldType === "number" ? "number" : "text"}
                                            {...register(`custom_${field.fieldName}`, { required: field.required ? `${field.fieldName} is required` : false })}
                                            className="h-12 bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-primary/20 rounded-[12px] text-[15px] transition-all shadow-sm"
                                            placeholder="Enter your answer..."
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <Button
                        type="submit"
                        className="w-full h-14 rounded-full text-[16px] font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Submitting Application..."
                            : job.testEnabled
                                ? "Submit & Start Assessment →"
                                : "Submit Application"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
