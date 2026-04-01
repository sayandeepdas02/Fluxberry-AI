'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { publicApi, PublicJob, ApplicationSubmission } from '@/lib/api/public'
import type { ApplicationField } from '@/lib/api/jobs'
import {
    Briefcase, MapPin, Clock, Building2, DollarSign,
    CheckCircle2, AlertCircle, Upload, Sparkles, Globe,
    ArrowLeft, ChevronRight, Star, X
} from 'lucide-react'

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const EMP_LABEL: Record<string, string> = {
    FULL_TIME: 'Full-time', PART_TIME: 'Part-time',
    CONTRACT: 'Contract', INTERN: 'Internship', OTHER: 'Other',
}

function timeAgo(iso?: string): string {
    if (!iso) return ''
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (d === 0) return 'Posted today'
    if (d === 1) return 'Posted yesterday'
    if (d < 30)  return `Posted ${d} days ago`
    return `Posted ${Math.floor(d / 30)} months ago`
}

// ──────────────────────────────────────────────────────────────
// Match Preview Panel
// ──────────────────────────────────────────────────────────────

function MatchPreview({ job }: { job: PublicJob }) {
    const required = job.requiredSkills ?? []
    const expMin   = job.experienceRange?.min
    if (required.length === 0 && !expMin) return null

    const top3    = required.slice(0, 3)
    const expText = expMin ? `${expMin}+ years` : undefined

    return (
        <div className="border border-primary/20 bg-primary/5 rounded-none overflow-hidden mb-8">
            <div className="px-4 py-2.5 border-b border-primary/15 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Screening Preview</span>
            </div>
            <div className="px-4 py-4 space-y-2 text-xs text-muted-foreground">
                {required.length > 0 && (
                    <>
                        <div className="flex items-start gap-2">
                            <span className="text-emerald-500 flex-shrink-0">✓</span>
                            <span>
                                Candidates with{' '}
                                <strong className="text-foreground">{top3.join(', ')}</strong>
                                {required.length > 3 ? ` + ${required.length - 3} more` : ''}
                                {expText ? ` and ${expText} experience` : ''}
                                {' '}→ <strong className="text-emerald-500">likely shortlisted</strong>
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500 flex-shrink-0">✗</span>
                            <span>
                                Candidates missing <strong className="text-foreground">{required[0]}</strong>
                                {required.length > 1 ? ' or other required skills' : ''}
                                {' '}→ <strong className="text-red-500">auto-rejected</strong> by ATS
                            </span>
                        </div>
                    </>
                )}
                {expMin && (
                    <div className="flex items-start gap-2">
                        <span className="text-red-500 flex-shrink-0">✗</span>
                        <span>
                            Candidates with &lt;{expMin} years experience → <strong className="text-red-500">auto-rejected</strong> (experience gate)
                        </span>
                    </div>
                )}
                <p className="pt-1 text-muted-foreground/60">
                    Applications are screened by AI before recruiter review. Matching all requirements maximises your chances.
                </p>
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────

export default function PublicJobPage() {
    const params = useParams()
    const slug   = params.slug as string

    const [job,      setJob]      = React.useState<PublicJob | null>(null)
    const [loading,  setLoading]  = React.useState(true)
    const [error,    setError]    = React.useState<string | null>(null)

    // Form state
    const [formData,         setFormData]         = React.useState<Record<string, unknown>>({})
    const [email,            setEmail]            = React.useState('')
    const [firstName,        setFirstName]        = React.useState('')
    const [lastName,         setLastName]         = React.useState('')
    const [phone,            setPhone]            = React.useState('')
    const [submitting,       setSubmitting]       = React.useState(false)
    const [submitted,        setSubmitted]        = React.useState(false)
    const [submitError,      setSubmitError]      = React.useState<string | null>(null)
    const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})
    const [resumeFile,       setResumeFile]       = React.useState<File | null>(null)
    const [resumeUploading,  setResumeUploading]  = React.useState(false)

    // Ref for smooth scroll to form
    const formRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!slug) return
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
        fetchJob()
    }, [slug])

    const fields: ApplicationField[] = (job?.applicationSchema as { fields?: ApplicationField[] })?.fields || []

    const handleFieldChange = (name: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        if (validationErrors[name]) {
            setValidationErrors(prev => { const n = { ...prev }; delete n[name]; return n })
        }
    }

    const validate = (): boolean => {
        const errors: Record<string, string> = {}
        if (!email)    errors._email     = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors._email = 'Invalid email'
        if (!firstName) errors._firstName = 'First name is required'
        for (const field of fields) {
            if (field.required) {
                const val = formData[field.name]
                if (val === undefined || val === null || val === '') {
                    errors[field.name] = `${field.label} is required`
                }
            }
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
            let resumeFileId: string | undefined
            if (resumeFile) {
                setResumeUploading(true)
                try {
                    const uploadRes = await publicApi.requestResumeUpload(slug, {
                        mimeType: resumeFile.type,
                        size:     resumeFile.size,
                    })
                    if (uploadRes.success && uploadRes.data) {
                        await fetch(uploadRes.data.uploadUrl, {
                            method: 'PUT',
                            body:   resumeFile,
                            headers: { 'Content-Type': resumeFile.type },
                        })
                        resumeFileId = uploadRes.data.storageKey
                    }
                } finally {
                    setResumeUploading(false)
                }
            }
            const submission: ApplicationSubmission = {
                firstName, lastName: lastName || undefined,
                email, phone: phone || undefined,
                applicationData: formData,
                resumeFileId,
            }
            const res = await publicApi.submitApplication(slug, submission)
            if (res.success) {
                setSubmitted(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
                setSubmitError(res.error?.message || 'Failed to submit application')
            }
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                    Loading...
                </div>
            </div>
        )
    }

    // ── Error ──
    if (error || !job) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h1 className="text-lg font-medium text-foreground mb-2">Job Not Found</h1>
                    <p className="text-sm text-muted-foreground mb-6">This job may have been closed or the link is invalid.</p>
                    <Link href="/jobs" className="text-sm text-primary hover:underline">Browse all jobs</Link>
                </div>
            </div>
        )
    }

    // ── Success ──
    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-sm mx-auto px-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl text-foreground mb-3">Application Submitted!</h1>
                    <p className="text-sm text-muted-foreground mb-2">
                        Thank you for applying to{' '}
                        <span className="font-medium text-foreground">{job.title}</span>
                        {job.company && <> at <span className="font-medium text-foreground">{job.company.name}</span></>}.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8">
                        Your application is being screened by AI. You'll hear back soon.
                    </p>
                    <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Browse more jobs
                    </Link>
                </div>
            </div>
        )
    }

    const company = job.company

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-10">
                {/* Back link */}
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    All jobs
                </Link>

                {/* Company header */}
                {company && (
                    <Link
                        href={`/company/${company.slug}`}
                        className="flex items-center gap-3 mb-8 group w-fit"
                    >
                        <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1" />
                            ) : (
                                <Building2 className="w-5 h-5 text-muted-foreground/40" />
                            )}
                        </div>
                        <div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {company.name}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 inline ml-1 group-hover:text-primary transition-colors" />
                        </div>
                    </Link>
                )}

                {/* Job title */}
                <h1 className="text-3xl text-foreground mb-4 leading-tight">{job.title}</h1>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {job.location && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                        </span>
                    )}
                    {job.department && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Briefcase className="w-3.5 h-3.5" />
                            {job.department}
                        </span>
                    )}
                    {job.employmentType && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border bg-muted/30 text-muted-foreground">
                            {EMP_LABEL[job.employmentType] ?? job.employmentType}
                        </span>
                    )}
                    {job.experienceRange && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border bg-muted/30 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {job.experienceRange.min}–{job.experienceRange.max} years exp
                        </span>
                    )}
                    {job.salaryRange && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salaryRange.min.toLocaleString()}–{job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                        </span>
                    )}
                    {job.publishedAt && (
                        <span className="text-xs text-muted-foreground/60 ml-auto">{timeAgo(job.publishedAt)}</span>
                    )}
                </div>

                {/* Required skills */}
                {(job.requiredSkills?.length ?? 0) > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Required skills</p>
                        <div className="flex flex-wrap gap-2">
                            {job.requiredSkills!.map(s => (
                                <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-sm bg-primary/10 text-primary border border-primary/20 font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Optional skills */}
                {(job.optionalSkills?.length ?? 0) > 0 && (
                    <div className="mb-6">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                            Nice to have
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {job.optionalSkills!.map(s => (
                                <span key={s} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-sm bg-muted/50 text-muted-foreground border border-border">
                                    <Star className="w-2.5 h-2.5 opacity-60" />
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Match preview */}
                <MatchPreview job={job} />

                {/* Description */}
                <div className="mb-10">
                    <h2 className="text-base font-semibold text-foreground mb-4">About the role</h2>
                    <div className="prose prose-sm text-muted-foreground max-w-none whitespace-pre-wrap leading-relaxed">
                        {job.description}
                    </div>
                </div>

                {/* Apply CTA — scroll anchor */}
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
                    <div>
                        <p className="font-semibold text-foreground">Ready to apply?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Takes less than 2 minutes</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Apply Now
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Apply form */}
                <div ref={formRef}>
                    <h2 className="text-xl text-foreground mb-2">Apply for this position</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Fill in your details below. Resume upload is optional but recommended.
                    </p>

                    {submitError && (
                        <div className="flex items-start gap-2 rounded-none border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 mb-6">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {submitError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-1.5">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => {
                                        setFirstName(e.target.value)
                                        if (validationErrors._firstName) setValidationErrors(p => { const n = { ...p }; delete n._firstName; return n })
                                    }}
                                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                {validationErrors._firstName && <p className="text-xs text-red-500 mt-1">{validationErrors._firstName}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-1.5">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Email + Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value)
                                        if (validationErrors._email) setValidationErrors(p => { const n = { ...p }; delete n._email; return n })
                                    }}
                                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                {validationErrors._email && <p className="text-xs text-red-500 mt-1">{validationErrors._email}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Resume upload */}
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">
                                Resume
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(PDF or DOCX, max 5MB)</span>
                            </label>
                            <label className={[
                                'flex items-center gap-3 px-4 py-3 border rounded-none cursor-pointer transition-all',
                                resumeFile
                                    ? 'border-primary/30 bg-primary/5'
                                    : 'border-dashed border-input hover:border-primary/40 bg-muted/10',
                            ].join(' ')}>
                                <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm text-muted-foreground flex-1">
                                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                                </span>
                                {resumeFile && (
                                    <button
                                        type="button"
                                        onClick={e => { e.preventDefault(); setResumeFile(null) }}
                                        className="text-muted-foreground/60 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx"
                                    onChange={e => {
                                        const file = e.target.files?.[0]
                                        if (file) setResumeFile(file)
                                    }}
                                />
                            </label>
                        </div>

                        {/* Custom fields */}
                        {fields.map(field => (
                            <div key={field.name}>
                                <label className="text-sm font-medium text-foreground block mb-1.5">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </label>

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={String(formData[field.name] || '')}
                                        onChange={e => handleFieldChange(field.name, e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                                    />
                                )}
                                {field.type === 'select' && (
                                    <select
                                        value={String(formData[field.name] || '')}
                                        onChange={e => handleFieldChange(field.name, e.target.value)}
                                        className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="">Select...</option>
                                        {(field.options || []).map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}
                                {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                                    <input
                                        type={field.type}
                                        value={String(formData[field.name] || '')}
                                        onChange={e => handleFieldChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                        className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                )}
                                {validationErrors[field.name] && (
                                    <p className="text-xs text-red-500 mt-1">{validationErrors[field.name]}</p>
                                )}
                            </div>
                        ))}

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting || resumeUploading}
                                className="w-full h-12 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                            >
                                {resumeUploading ? 'Uploading resume...' : submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <p className="text-xs text-center text-muted-foreground mt-3">
                                By applying, your application will be reviewed by AI-powered screening before recruiter review.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
