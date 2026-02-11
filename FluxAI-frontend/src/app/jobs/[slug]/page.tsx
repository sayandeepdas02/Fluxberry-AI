'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { publicApi, PublicJob, ApplicationSubmission } from '@/lib/api/public'
import type { ApplicationField } from '@/lib/api/jobs'
import { Briefcase, MapPin, Clock, Building2, DollarSign, CheckCircle2, AlertCircle, Upload } from 'lucide-react'

export default function PublicJobPage() {
    const params = useParams()
    const slug = params.slug as string

    const [job, setJob] = React.useState<PublicJob | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    // Form state
    const [formData, setFormData] = React.useState<Record<string, unknown>>({})
    const [email, setEmail] = React.useState('')
    const [firstName, setFirstName] = React.useState('')
    const [lastName, setLastName] = React.useState('')
    const [phone, setPhone] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)
    const [submitError, setSubmitError] = React.useState<string | null>(null)
    const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

    // Resume upload state
    const [resumeFile, setResumeFile] = React.useState<File | null>(null)
    const [resumeUploading, setResumeUploading] = React.useState(false)

    React.useEffect(() => {
        async function fetchJob() {
            setLoading(true)
            try {
                const res = await publicApi.getJobBySlug(slug)
                if (res.success && res.data) {
                    setJob(res.data)
                } else {
                    setError('Job not found')
                }
            } catch {
                setError('Failed to load job details')
            } finally {
                setLoading(false)
            }
        }
        if (slug) fetchJob()
    }, [slug])

    const fields: ApplicationField[] = (job?.applicationSchema as { fields?: ApplicationField[] })?.fields || []

    const handleFieldChange = (name: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear validation error on change
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const next = { ...prev }
                delete next[name]
                return next
            })
        }
    }

    const validate = (): boolean => {
        const errors: Record<string, string> = {}

        if (!email) errors._email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors._email = 'Invalid email'
        if (!firstName) errors._firstName = 'First name is required'

        for (const field of fields) {
            if (field.required) {
                const val = formData[field.name]
                if (val === undefined || val === null || val === '') {
                    errors[field.name] = `${field.label} is required`
                }
            }
            // Email validation
            if (field.type === 'email' && formData[field.name]) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData[field.name]))) {
                    errors[field.name] = `${field.label} must be a valid email`
                }
            }
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setSubmitting(true)
        setSubmitError(null)

        try {
            // Upload resume first if present
            let resumeFileId: string | undefined
            if (resumeFile) {
                setResumeUploading(true)
                try {
                    const uploadRes = await publicApi.requestResumeUpload(slug, {
                        mimeType: resumeFile.type,
                        size: resumeFile.size,
                    })
                    if (uploadRes.success && uploadRes.data) {
                        // Upload file to pre-signed URL
                        await fetch(uploadRes.data.uploadUrl, {
                            method: 'PUT',
                            body: resumeFile,
                            headers: { 'Content-Type': resumeFile.type },
                        })
                        resumeFileId = uploadRes.data.storageKey
                    }
                } finally {
                    setResumeUploading(false)
                }
            }

            const submission: ApplicationSubmission = {
                firstName,
                lastName: lastName || undefined,
                email,
                phone: phone || undefined,
                applicationData: formData,
                resumeFileId,
            }

            const res = await publicApi.submitApplication(slug, submission)
            if (res.success) {
                setSubmitted(true)
            } else {
                setSubmitError(res.error?.message || 'Failed to submit application')
            }
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                    Loading...
                </div>
            </div>
        )
    }

    // Error state
    if (error || !job) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h1 className="text-lg font-medium text-foreground mb-2">Job Not Found</h1>
                    <p className="text-sm text-muted-foreground">
                        This job may have been closed or the link is invalid.
                    </p>
                </div>
            </div>
        )
    }

    // Success state
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-semibold text-foreground mb-3">Application Submitted!</h1>
                    <p className="text-sm text-muted-foreground">
                        Thank you for applying to <span className="font-medium text-foreground">{job.title}</span>
                        {job.company && <> at <span className="font-medium text-foreground">{(job.company as { name?: string }).name}</span></>}.
                        We&apos;ll review your application and get back to you soon.
                    </p>
                </div>
            </div>
        )
    }

    const company = job.company as { name?: string; logoUrl?: string; slug?: string } | undefined

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Company Header */}
                {company && (
                    <div className="flex items-center gap-3 mb-8">
                        {company.logoUrl ? (
                            <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-lg" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-muted-foreground/50" />
                            </div>
                        )}
                        <span className="text-sm font-medium text-muted-foreground">{company.name}</span>
                    </div>
                )}

                {/* Job Details */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-foreground mb-4">{job.title}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                        {job.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                            </span>
                        )}
                        {job.department && (
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4" />
                                {job.department}
                            </span>
                        )}
                        {job.employmentType && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {job.employmentType.replace(/_/g, ' ')}
                            </span>
                        )}
                        {job.salaryRange && (
                            <span className="flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                            </span>
                        )}
                    </div>

                    {/* Skills */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {job.requiredSkills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-2.5 py-1 rounded-full bg-muted/40 text-muted-foreground border border-edge"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div className="prose prose-sm text-muted-foreground max-w-none whitespace-pre-wrap">
                        {job.description}
                    </div>
                </div>

                {/* Application Form */}
                <div className="border-t border-edge pt-10">
                    <h2 className="text-xl font-semibold text-foreground mb-6">Apply for this position</h2>

                    {submitError && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 mb-6">
                            {submitError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Standard Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-foreground block mb-1.5">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => {
                                        setFirstName(e.target.value)
                                        if (validationErrors._firstName) {
                                            setValidationErrors(prev => { const n = { ...prev }; delete n._firstName; return n })
                                        }
                                    }}
                                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                {validationErrors._firstName && (
                                    <p className="text-xs text-red-500 mt-1">{validationErrors._firstName}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-foreground block mb-1.5">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-foreground block mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value)
                                        if (validationErrors._email) {
                                            setValidationErrors(prev => { const n = { ...prev }; delete n._email; return n })
                                        }
                                    }}
                                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                {validationErrors._email && (
                                    <p className="text-xs text-red-500 mt-1">{validationErrors._email}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-foreground block mb-1.5">Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Dynamic form fields from applicationSchema */}
                        {fields.map((field) => (
                            <div key={field.name}>
                                <label className="text-sm text-foreground block mb-1.5">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </label>

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={String(formData[field.name] || '')}
                                        onChange={e => handleFieldChange(field.name, e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                                    />
                                )}

                                {field.type === 'select' && (
                                    <select
                                        value={String(formData[field.name] || '')}
                                        onChange={e => handleFieldChange(field.name, e.target.value)}
                                        className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">Select...</option>
                                        {(field.options || []).map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'file' && (
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background cursor-pointer hover:bg-muted/30 transition-colors">
                                            <Upload className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {resumeFile ? resumeFile.name : 'Choose file'}
                                            </span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.docx"
                                                onChange={e => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setResumeFile(file)
                                                        handleFieldChange(field.name, file.name)
                                                    }
                                                }}
                                            />
                                        </label>
                                        <span className="text-xs text-muted-foreground/50">PDF or DOCX, max 5MB</span>
                                    </div>
                                )}

                                {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                                    <input
                                        type={field.type}
                                        value={String(formData[field.name] || '')}
                                        onChange={e => handleFieldChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                        className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                )}

                                {validationErrors[field.name] && (
                                    <p className="text-xs text-red-500 mt-1">{validationErrors[field.name]}</p>
                                )}
                            </div>
                        ))}

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting || resumeUploading}
                                className="w-full h-11 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resumeUploading ? 'Uploading resume...' : submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
