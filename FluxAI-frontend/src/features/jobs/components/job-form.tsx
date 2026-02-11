'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { FormBuilder } from './form-builder'
import type { CreateJobInput, UpdateJobInput, ApplicationSchema, Job } from '@/lib/api/jobs'

interface JobFormProps {
    mode: 'create' | 'edit'
    initialData?: Partial<Job>
    onSubmit: (data: CreateJobInput) => Promise<Job | null>
}

const EMPLOYMENT_TYPES = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERN', label: 'Internship' },
    { value: 'OTHER', label: 'Other' },
]

export function JobForm({ mode, initialData, onSubmit }: JobFormProps) {
    const router = useRouter()
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [title, setTitle] = React.useState(initialData?.title || '')
    const [description, setDescription] = React.useState(initialData?.description || '')
    const [department, setDepartment] = React.useState(initialData?.department || '')
    const [location, setLocation] = React.useState(initialData?.location || '')
    const [employmentType, setEmploymentType] = React.useState<string>(initialData?.employmentType || 'FULL_TIME')
    const [skillsInput, setSkillsInput] = React.useState((initialData?.requiredSkills || []).join(', '))
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
                requiredSkills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
                applicationSchema: applicationSchema.fields.length > 0 ? applicationSchema : undefined,
            }

            // Add salary if provided
            if (salaryMin || salaryMax) {
                data.salaryRange = {
                    min: parseInt(salaryMin) || 0,
                    max: parseInt(salaryMax) || 0,
                    currency: salaryCurrency,
                }
            }

            const result = await onSubmit(data)
            if (result) {
                router.push('/dashboard/manage-jobs')
            } else {
                setError('Failed to save job. Please try again.')
            }
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
                {/* Basic Info */}
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
                            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
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
                            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-y"
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
                                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. Remote, San Francisco"
                                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-foreground block mb-1.5">Employment Type</label>
                        <select
                            value={employmentType}
                            onChange={e => setEmploymentType(e.target.value)}
                            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            {EMPLOYMENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Skills & Requirements */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Skills & Compensation
                    </h2>

                    <div>
                        <label className="text-sm text-foreground block mb-1.5">
                            Required Skills (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={skillsInput}
                            onChange={e => setSkillsInput(e.target.value)}
                            placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Salary Min</label>
                            <input
                                type="number"
                                value={salaryMin}
                                onChange={e => setSalaryMin(e.target.value)}
                                placeholder="0"
                                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Salary Max</label>
                            <input
                                type="number"
                                value={salaryMax}
                                onChange={e => setSalaryMax(e.target.value)}
                                placeholder="0"
                                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-foreground block mb-1.5">Currency</label>
                            <select
                                value={salaryCurrency}
                                onChange={e => setSalaryCurrency(e.target.value)}
                                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Application Form Builder */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Application Form
                    </h2>
                    <FormBuilder value={applicationSchema} onChange={setApplicationSchema} />
                </section>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-edge">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-edge text-foreground hover:bg-muted/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !title || !description}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : mode === 'create' ? 'Create Draft' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
