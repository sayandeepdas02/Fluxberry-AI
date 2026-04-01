'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Zap } from 'lucide-react'
import { FormBuilder } from './form-builder'
import type { CreateJobInput, ApplicationSchema, Job } from '@/lib/api/jobs'

interface JobFormProps {
    mode: 'create' | 'edit'
    initialData?: Partial<Job>
    onSubmit: (data: CreateJobInput) => Promise<Job>
}

const EMPLOYMENT_TYPES = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERN', label: 'Internship' },
    { value: 'OTHER', label: 'Other' },
]

// ──────────────────────────────────────────────────────────────
// Chip input component for skills
// ──────────────────────────────────────────────────────────────

function ChipInput({
    value,
    onChange,
    placeholder,
    id,
}: {
    value: string[]
    onChange: (chips: string[]) => void
    placeholder?: string
    id?: string
}) {
    const [input, setInput] = React.useState('')
    const inputRef = React.useRef<HTMLInputElement>(null)

    const addChip = (raw: string) => {
        const chips = raw.split(',').map(s => s.trim()).filter(Boolean)
        const next = Array.from(new Set([...value, ...chips]))
        onChange(next)
        setInput('')
    }

    const removeChip = (chip: string) => {
        onChange(value.filter(c => c !== chip))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (input.trim()) addChip(input)
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1))
        }
    }

    return (
        <div
            className="min-h-10 w-full flex flex-wrap gap-1.5 px-2 py-1.5 border border-input bg-background rounded-none focus-within:ring-1 focus-within:ring-ring cursor-text"
            onClick={() => inputRef.current?.focus()}
        >
            {value.map(chip => (
                <span
                    key={chip}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-sm bg-primary/10 text-primary border border-primary/20 font-medium"
                >
                    {chip}
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeChip(chip) }}
                        className="hover:text-red-500 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                id={id}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (input.trim()) addChip(input) }}
                placeholder={value.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Job Form
// ──────────────────────────────────────────────────────────────

export function JobForm({ mode, initialData, onSubmit }: JobFormProps) {
    const router = useRouter()
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [title, setTitle] = React.useState(initialData?.title || '')
    const [description, setDescription] = React.useState(initialData?.description || '')
    const [department, setDepartment] = React.useState(initialData?.department || '')
    const [location, setLocation] = React.useState(initialData?.location || '')
    const [employmentType, setEmploymentType] = React.useState<string>(initialData?.employmentType || 'FULL_TIME')

    // Chip-based skills (required + optional)
    const [requiredSkills, setRequiredSkills] = React.useState<string[]>(initialData?.requiredSkills || [])
    const [optionalSkills, setOptionalSkills] = React.useState<string[]>((initialData as any)?.optionalSkills || [])

    // Experience range
    const [expMin, setExpMin] = React.useState<string>((initialData as any)?.experienceRange?.min?.toString() || '')
    const [expMax, setExpMax] = React.useState<string>((initialData as any)?.experienceRange?.max?.toString() || '')

    const [salaryMin, setSalaryMin] = React.useState(initialData?.salaryRange?.min?.toString() || '')
    const [salaryMax, setSalaryMax] = React.useState(initialData?.salaryRange?.max?.toString() || '')
    const [salaryCurrency, setSalaryCurrency] = React.useState(initialData?.salaryRange?.currency || 'USD')
    const [applicationSchema, setApplicationSchema] = React.useState<ApplicationSchema>(
        (initialData?.applicationSchema as ApplicationSchema) || { fields: [] }
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const data: CreateJobInput = {
                title,
                description,
                department: department || undefined,
                location: location || undefined,
                employmentType,
                requiredSkills,
                // optionalSkills and experienceRange will be picked up by the API
                // via the extended Zod schema on the backend
                ...(optionalSkills.length > 0 ? { optionalSkills } : {}),
                ...(expMin || expMax ? {
                    experienceRange: {
                        min: parseInt(expMin) || 0,
                        max: parseInt(expMax) || 0,
                    }
                } : {}),
                applicationSchema: applicationSchema.fields.length > 0 ? applicationSchema : undefined,
            } as any

            if (salaryMin || salaryMax) {
                (data as any).salaryRange = {
                    min: parseInt(salaryMin) || 0,
                    max: parseInt(salaryMax) || 0,
                    currency: salaryCurrency,
                }
            }

            await onSubmit(data)
            router.push('/dashboard/manage-jobs')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-foreground">
                        {mode === 'create' ? 'Create New Job Post' : 'Edit Job Post'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {mode === 'create'
                            ? 'Fill in the details below to create a draft job post'
                            : 'Update the job post details'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* ── Basic Info ── */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Basic Information
                    </h2>

                    <div>
                        <label className="text-sm text-foreground block mb-1.5">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Senior Frontend Engineer"
                            className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-foreground block mb-1.5">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            rows={5}
                            placeholder="Describe the role, responsibilities, and expectations..."
                            className="w-full px-3 py-2 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Department</label>
                            <input
                                type="text"
                                value={department}
                                onChange={e => setDepartment(e.target.value)}
                                placeholder="e.g. Engineering"
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Remote, San Francisco"
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-foreground block mb-1.5">Employment Type</label>
                        <select
                            value={employmentType}
                            onChange={e => setEmploymentType(e.target.value)}
                            className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {EMPLOYMENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* ── Skills & ATS ── */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Skills & ATS Configuration
                    </h2>

                    {/* ATS Awareness Banner */}
                    <div className="flex items-start gap-3 rounded-none border border-primary/20 bg-primary/5 px-4 py-3">
                        <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">ATS Auto-Screening is active. </span>
                            Required skills are used as hard gates — candidates missing them are automatically filtered out.
                            Optional skills boost a candidate's relevance score. Experience range sets the minimum threshold.
                        </div>
                    </div>

                    <div>
                        <label htmlFor="required-skills" className="text-sm text-foreground block mb-1.5">
                            Required Skills
                            <span className="ml-1.5 text-xs text-muted-foreground">(press Enter or comma to add)</span>
                        </label>
                        <ChipInput
                            id="required-skills"
                            value={requiredSkills}
                            onChange={setRequiredSkills}
                            placeholder="e.g. React, TypeScript, Node.js"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Candidates must have these skills to pass screening.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="optional-skills" className="text-sm text-foreground block mb-1.5">
                            Optional Skills
                            <span className="ml-1.5 text-xs text-muted-foreground">(nice-to-have)</span>
                        </label>
                        <ChipInput
                            id="optional-skills"
                            value={optionalSkills}
                            onChange={setOptionalSkills}
                            placeholder="e.g. GraphQL, Redis, Docker"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            These boost a candidate's relevance score but are not required.
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-foreground block mb-1.5">
                            Experience Range (years)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                id="exp-min"
                                value={expMin}
                                onChange={e => setExpMin(e.target.value)}
                                min="0"
                                max="30"
                                placeholder="Min"
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <span className="text-muted-foreground text-sm flex-shrink-0">to</span>
                            <input
                                type="number"
                                id="exp-max"
                                value={expMax}
                                onChange={e => setExpMax(e.target.value)}
                                min="0"
                                max="30"
                                placeholder="Max"
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimum experience is a hard gate. Candidates below this threshold will not pass ATS screening.
                        </p>
                    </div>
                </section>

                {/* ── Compensation ── */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Compensation
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Salary Min</label>
                            <input
                                type="number"
                                value={salaryMin}
                                onChange={e => setSalaryMin(e.target.value)}
                                placeholder="0"
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Salary Max</label>
                            <input
                                type="number"
                                value={salaryMax}
                                onChange={e => setSalaryMax(e.target.value)}
                                placeholder="0"
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Currency</label>
                            <select
                                value={salaryCurrency}
                                onChange={e => setSalaryCurrency(e.target.value)}
                                className="w-full h-10 px-3 text-sm rounded-none border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* ── Application Form Builder ── */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Application Form
                    </h2>
                    <FormBuilder value={applicationSchema} onChange={setApplicationSchema} />
                </section>

                {/* ── Submit ── */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium rounded-none border border-border text-foreground hover:bg-muted/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !title || !description}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : mode === 'create' ? 'Create Draft' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
