"use client"

import { useState, useRef, useCallback, use } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Briefcase, Clock, Upload, CheckCircle2, Building, Loader2, FileText, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePublicJob } from "@/features/public/hooks/use-public-job"
import { publicApi } from "@/lib/api/public"
import { toast } from "sonner"
import type { ApplicationQuestion } from "@/lib/api/jobs"

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface FormData {
    firstName: string
    lastName: string
    email: string
    countryCode: string
    phone: string
    [key: string]: string | boolean  // custom question answers keyed by question id
}

interface FormErrors {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    resume?: string
}

type SubmitState = "idle" | "uploading" | "submitting" | "success" | "error"

interface ResumeFile {
    file: File
    storageKey: string | null
    status: "pending" | "uploading" | "uploaded" | "error"
    error?: string
}

// ──────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function validateForm(data: FormData, resume: ResumeFile | null): FormErrors {
    const errors: FormErrors = {}

    if (!data.firstName.trim()) errors.firstName = "First name is required"
    if (!data.lastName.trim()) errors.lastName = "Last name is required"
    if (!data.email.trim()) {
        errors.email = "Email is required"
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
        errors.email = "Please enter a valid email address"
    }
    if (!resume) {
        errors.resume = "Resume is required"
    } else if (resume.status === "error") {
        errors.resume = resume.error || "Resume upload failed"
    }

    return errors
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export default function JobApplicationPage({ params }: { params: Promise<{ companySlug: string, jobId: string }> }) {
    const { companySlug, jobId } = use(params);
    const { job, company, isLoading, error } = usePublicJob(companySlug, jobId)
    const [activeTab, setActiveTab] = useState<"details" | "form">("details")

    // ── Form state ───────────────────────────────────────────
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        countryCode: "+1",
        phone: "",
    })
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [resume, setResume] = useState<ResumeFile | null>(null)
    const [submitState, setSubmitState] = useState<SubmitState>("idle")
    const [submitError, setSubmitError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dropZoneRef = useRef<HTMLDivElement>(null)

    // ── Input handlers ───────────────────────────────────────
    const handleInputChange = useCallback((field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field on change
        setFormErrors(prev => {
            if (prev[field as keyof FormErrors]) {
                const next = { ...prev }
                delete next[field as keyof FormErrors]
                return next
            }
            return prev
        })
    }, [])

    // ── Resume upload ────────────────────────────────────────

    const uploadResume = useCallback(async (file: File) => {
        if (!job?.publicSlug) {
            toast.error("Job information not loaded yet")
            return
        }

        // Validate file
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            toast.error("Only PDF and DOCX files are supported")
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File must be less than 5 MB")
            return
        }

        // Set pending state
        const resumeFile: ResumeFile = { file, storageKey: null, status: "uploading" }
        setResume(resumeFile)
        setFormErrors(prev => { const n = { ...prev }; delete n.resume; return n })

        try {
            // Step 1: Get pre-signed upload URL
            const urlRes = await publicApi.requestResumeUpload(job.publicSlug, {
                mimeType: file.type,
                size: file.size,
            })

            if (!urlRes.success || !urlRes.data) {
                throw new Error(urlRes.error?.message || "Failed to get upload URL")
            }

            const { uploadUrl, storageKey } = urlRes.data

            // Step 2: Upload file to pre-signed URL (PUT for S3, PUT for local)
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            })

            if (!uploadRes.ok) {
                throw new Error(`Upload failed with status ${uploadRes.status}`)
            }

            // Success
            setResume({ file, storageKey, status: "uploaded" })
            toast.success("Resume uploaded successfully")

        } catch (err) {
            const message = err instanceof Error ? err.message : "Upload failed"
            setResume({ file, storageKey: null, status: "error", error: message })
            toast.error(message)
        }
    }, [job?.publicSlug])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) uploadResume(file)
        // Reset input so the same file can be re-selected
        if (e.target) e.target.value = ""
    }, [uploadResume])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer.files?.[0]
        if (file) uploadResume(file)
    }, [uploadResume])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const removeResume = useCallback(() => {
        setResume(null)
    }, [])

    // ── Form submission ──────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!job?.publicSlug) return

        // Validate
        const errors = validateForm(formData, resume)
        setFormErrors(errors)
        if (Object.keys(errors).length > 0) {
            toast.error("Please fix the errors before submitting")
            return
        }

        // Check resume is uploaded
        if (!resume || resume.status !== "uploaded" || !resume.storageKey) {
            setFormErrors(prev => ({ ...prev, resume: "Please upload your resume first" }))
            return
        }

        setSubmitState("submitting")
        setSubmitError(null)

        try {
            const phone = formData.phone.trim()
                ? `${formData.countryCode}${formData.phone.trim()}`
                : undefined

            // Collect custom question answers from formData
            const applicationData: Record<string, unknown> = {}
            for (const q of (job.applicationQuestions ?? [])) {
                applicationData[q.id] = formData[q.id] ?? ''
            }

            const result = await publicApi.submitApplication(job.publicSlug, {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone,
                applicationData,
                resumeFileId: resume.storageKey,
            })

            if (!result.success) {
                const code = result.error?.code
                if (code === "DUPLICATE_APPLICATION") {
                    throw new Error("You have already applied for this position.")
                }
                throw new Error(result.error?.message || "Submission failed")
            }

            setSubmitState("success")
            toast.success("Application submitted successfully!")

        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            setSubmitState("error")
            setSubmitError(message)
            toast.error(message)
        }
    }, [job?.publicSlug, formData, resume])

    // ── Loading / Error states ───────────────────────────────

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-600">Loading job details...</div>
    }

    if (error || !job || !company) {
        return <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-red-600">Job not found or error loading page.</div>
    }

    // Fallback if description is plain text
    const descriptionHtml = job.description || '<p>No description provided.</p>'

    // ── Success state ────────────────────────────────────────

    if (submitState === "success") {
        return (
            <div className="flex min-h-screen flex-col bg-zinc-50/50 mx-auto w-full border-x border-line max-w-[var(--container-max)] text-zinc-900 selection:bg-orange-100 selection:text-orange-900">
                <div className="container mx-auto max-w-2xl px-6 py-24 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl tracking-tight text-zinc-900 mb-3">Application Submitted</h1>
                    <p className="text-zinc-500 text-[15px] leading-relaxed max-w-md mx-auto mb-8">
                        Thank you for applying to <span className="text-zinc-900 font-medium">{job.title}</span> at{" "}
                        <span className="text-zinc-900 font-medium">{company.name}</span>.
                        We&apos;ll review your application and get back to you soon.
                    </p>
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="rounded-full px-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to jobs
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50/50 mx-auto w-full border-x border-line max-w-[var(--container-max)] text-zinc-900 selection:bg-orange-100 selection:text-orange-900">
            {/* 1. Header Section */}
            <div className="bg-background border-b border-zinc-100">
                <div className="container mx-auto max-w-3xl px-6 pt-12 pb-8">
                    <button onClick={() => window.history.back()} className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Return to jobs list
                    </button>

                    <div className="text-center space-y-6">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white mx-auto flex items-center justify-center text-xl shadow-sm overflow-hidden">
                            {company.logoUrl ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" /> : company.name[0]}
                        </div>

                        <h1 className="text-3xl md:text-4xl tracking-tight text-zinc-900">
                            {job.title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-zinc-500 font-medium">
                            {job.employmentType && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Job type: <span className="text-zinc-900">{job.employmentType.replace(/_/g, ' ')}</span></span>}
                            {job.department && <span className="w-1 h-1 rounded-full bg-zinc-300" />}
                            {job.department && <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Department: <span className="text-zinc-900">{job.department}</span></span>}
                            {job.location && <span className="w-1 h-1 rounded-full bg-zinc-300" />}
                            {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location: <span className="text-zinc-900">{job.location}</span></span>}
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => setActiveTab("form")}
                                className="bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-full px-8 h-10 font-medium shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                            >
                                Apply for this position
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Tabs */}
                <div className="container mx-auto max-w-3xl px-6 mt-8">
                    <div className="flex border-b border-zinc-200 gap-8">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={cn(
                                "pb-3 text-sm font-medium transition-all relative",
                                activeTab === "details" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            Job details
                            {activeTab === "details" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF5A1F]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("form")}
                            className={cn(
                                "pb-3 text-sm font-medium transition-all relative",
                                activeTab === "form" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                            )}
                        >
                            Application form
                            {activeTab === "form" && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF5A1F]" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Main Content */}
            <div className="container mx-auto max-w-3xl px-6 py-12">

                {/* Tab: Job Details */}
                {activeTab === "details" && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div
                            className="prose prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-600"
                            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                        />

                        <div className="pt-8 flex justify-center">
                            <Button
                                onClick={() => setActiveTab("form")}
                                className="bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-full px-8 h-10 font-medium shadow-sm w-full sm:w-auto"
                            >
                                Apply for this position
                            </Button>
                        </div>

                        <div className="pt-12 flex justify-center pb-8">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                                Made with <span className="flex items-center gap-1"><div className="w-4 h-4 bg-zinc-900 rounded-[2px] flex items-center justify-center text-[8px] text-white">F</div> Fluxberry AI</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Application Form */}
                {activeTab === "form" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">

                        {/* Autofill (upload triggers resume upload) */}
                        <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-full text-orange-600">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-sm text-zinc-900">Autofill application</h3>
                                    <p className="text-xs text-muted-foreground">Save time by importing your resume.</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-4"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={resume?.status === "uploading"}
                            >
                                {resume?.status === "uploading" ? (
                                    <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Uploading...</>
                                ) : "Upload file"}
                            </Button>
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-zinc-900">Personal Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Enter your first name"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        className={formErrors.firstName ? "border-red-400 focus-visible:ring-red-400" : ""}
                                    />
                                    {formErrors.firstName && <p className="text-xs text-red-500">{formErrors.firstName}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Enter your last name"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        className={formErrors.lastName ? "border-red-400 focus-visible:ring-red-400" : ""}
                                    />
                                    {formErrors.lastName && <p className="text-xs text-red-500">{formErrors.lastName}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    className={formErrors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                                />
                                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <div className="flex">
                                    <div className="w-[100px] border-r-0 rounded-r-none">
                                        <Input
                                            placeholder="+1"
                                            className="rounded-r-none focus:z-10"
                                            value={formData.countryCode}
                                            onChange={(e) => handleInputChange("countryCode", e.target.value)}
                                        />
                                    </div>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        className="rounded-l-none -ml-[1px]"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-zinc-100" />

                        {/* Resume Upload — hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Resume Upload Zone */}
                        <div className="space-y-3">
                            <Label>Resume <span className="text-red-500">*</span></Label>

                            {/* Show uploaded file */}
                            {resume && resume.status !== "error" ? (
                                <div className="border border-zinc-200 rounded-lg p-4 bg-white flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            resume.status === "uploaded" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                                        )}>
                                            {resume.status === "uploading" ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <FileText className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 truncate">{resume.file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(resume.file.size / 1024).toFixed(0)} KB
                                                {resume.status === "uploading" && " — Uploading..."}
                                                {resume.status === "uploaded" && " — Uploaded"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={removeResume}
                                        className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                                        disabled={resume.status === "uploading"}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    ref={dropZoneRef}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors cursor-pointer group",
                                        formErrors.resume ? "border-red-400 bg-red-50/30" : "border-zinc-300",
                                    )}
                                >
                                    <div className="p-3 bg-zinc-50 rounded-full text-zinc-400 group-hover:scale-110 transition-transform mb-3">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-900">Upload your file <span className="text-muted-foreground font-normal">or drag and drop here</span></p>
                                    <p className="text-xs text-muted-foreground mt-1">Supported formats: .pdf, .docx</p>
                                    <Button variant="outline" className="mt-4 rounded-full text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs px-4" type="button">
                                        Upload file
                                    </Button>
                                </div>
                            )}

                            {/* Resume error */}
                            {(formErrors.resume || resume?.status === "error") && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {formErrors.resume || resume?.error}
                                </p>
                            )}
                        </div>

                        <div className="w-full h-px bg-zinc-100" />

                        {/* Custom Application Questions */}
                        {(job.applicationQuestions ?? []).length > 0 && (
                            <div className="space-y-5">
                                <h2 className="text-lg font-semibold text-zinc-900">Additional Questions</h2>
                                {(job.applicationQuestions ?? []).map((q: ApplicationQuestion) => (
                                    <div key={q.id} className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-900">
                                            {q.label}
                                            {q.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {q.type === 'textarea' ? (
                                            <Textarea
                                                placeholder={q.placeholder || ''}
                                                value={String(formData[q.id] || '')}
                                                onChange={e => setFormData(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                required={q.required}
                                            />
                                        ) : q.type === 'select' ? (
                                            <select
                                                value={String(formData[q.id] || '')}
                                                onChange={e => setFormData(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                required={q.required}
                                                className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                            >
                                                <option value="">Select an option</option>
                                                {(q.options ?? []).map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : q.type === 'checkbox' ? (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(formData[q.id])}
                                                    onChange={e => setFormData(prev => ({ ...prev, [q.id]: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-zinc-600">{q.placeholder || 'Yes'}</span>
                                            </label>
                                        ) : (
                                            <Input
                                                type="text"
                                                placeholder={q.placeholder || ''}
                                                value={String(formData[q.id] || '')}
                                                onChange={e => setFormData(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                required={q.required}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Submit error banner */}
                        {submitState === "error" && submitError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-900">Submission failed</p>
                                    <p className="text-xs text-red-700 mt-0.5">{submitError}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-6">
                            <Button
                                className="w-full bg-[#FF5A1F] hover:bg-[#E04812] text-white rounded-lg h-11 font-medium shadow-sm text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSubmit}
                                disabled={submitState === "submitting" || submitState === "uploading" || resume?.status === "uploading"}
                            >
                                {submitState === "submitting" ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting application...</>
                                ) : (
                                    "Apply for this position"
                                )}
                            </Button>
                            <p className="text-[11px] text-center text-muted-foreground mt-3">
                                By applying, you agree to our terms of service and privacy policy.
                            </p>
                        </div>

                        <div className="pt-12 flex justify-center pb-8 border-t border-zinc-100 mt-12">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                                Made with <span className="flex items-center gap-1"><div className="w-4 h-4 bg-zinc-900 rounded-[2px] flex items-center justify-center text-[8px] text-white">F</div> Fluxberry AI</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}
