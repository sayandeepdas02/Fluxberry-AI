"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { jobsApi, CreateJobInput, ApplicationQuestion, JobVisibility } from "@/lib/api/jobs"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Loader2, Briefcase, ChevronRight, ChevronLeft, Check,
    Plus, Trash2, GripVertical,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import crypto from 'crypto'

const STEPS = ['Basics', 'Description', 'Requirements', 'Settings', 'Review']

const QUESTION_TYPES = [
    { value: 'text',     label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select',   label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'file',     label: 'File Upload' },
]

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

export default function CreateJobPage() {
    const router = useRouter()
    const [step, setStep] = useState(0)

    // Step 0: Basics
    const [title, setTitle] = useState('')
    const [department, setDepartment] = useState('')
    const [location, setLocation] = useState('')
    const [employmentType, setEmploymentType] = useState('FULL_TIME')

    // Step 1: Description
    const [description, setDescription] = useState('')

    // Step 2: Requirements & Skills
    const [requirements, setRequirements] = useState('')
    const [skills, setSkills] = useState('')
    const [expMin, setExpMin] = useState('')
    const [expMax, setExpMax] = useState('')

    // Step 3: Settings
    const [visibility, setVisibility] = useState<JobVisibility>('PUBLIC')
    const [expiresAt, setExpiresAt] = useState('')
    const [questions, setQuestions] = useState<ApplicationQuestion[]>([])

    const createMutation = useApiMutation({
        mutationFn: (data: CreateJobInput) => jobsApi.create(data),
        successMessage: 'Job created successfully',
        invalidateKeys: [['jobs']],
        onSuccess: () => {
            router.push('/dashboard/jobs/manage')
        },
    })

    const handleSubmit = () => {
        if (!title.trim()) return toast.error('Title is required')
        if (!description.trim()) return toast.error('Description is required')

        createMutation.mutate({
            title: title.trim(),
            description: description.trim(),
            department: department.trim() || undefined,
            location: location.trim() || undefined,
            employmentType: employmentType as any,
            visibility,
            requirements: requirements ? requirements.split('\n').map(r => r.trim()).filter(Boolean) : undefined,
            requiredSkills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            experienceRange: expMin ? { min: Number(expMin), max: Number(expMax || expMin) } : undefined,
            expiresAt: expiresAt || undefined,
            applicationQuestions: questions.length > 0 ? questions : undefined,
        })
    }

    function addQuestion() {
        setQuestions(prev => [...prev, {
            id: generateId(),
            label: '',
            type: 'text',
            required: false,
        }])
    }

    function removeQuestion(id: string) {
        setQuestions(prev => prev.filter(q => q.id !== id))
    }

    function updateQuestion(id: string, patch: Partial<ApplicationQuestion>) {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))
    }

    const canProceed =
        step === 0 ? !!title.trim() :
        step === 1 ? !!description.trim() :
        true

    return (
        <PageContainer title="Create Job" description="Create a new job posting and start receiving applications.">
            <ErrorBoundary section="Create Job">
            <div className="mt-6 w-full max-w-2xl mx-auto">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <button
                                onClick={() => i <= step && setStep(i)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    i === step ? 'bg-accent text-accent-foreground'
                                    : i < step ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                                {s}
                            </button>
                            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className="border border-line rounded-lg bg-card/50 p-6 space-y-4 animate-in fade-in duration-200">

                    {/* ── Step 0: Basics ──────────────────────────────── */}
                    {step === 0 && (
                        <>
                            <h3 className="text-sm font-semibold">Job Basics</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Job Title *</label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="bg-card" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                                        <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="bg-card" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                                        <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Remote, Bangalore" className="bg-card" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Employment Type</label>
                                    <Select value={employmentType} onValueChange={setEmploymentType}>
                                        <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                            <SelectItem value="PART_TIME">Part Time</SelectItem>
                                            <SelectItem value="CONTRACT">Contract</SelectItem>
                                            <SelectItem value="INTERN">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Step 1: Description ──────────────────────────── */}
                    {step === 1 && (
                        <>
                            <h3 className="text-sm font-semibold">Job Description *</h3>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe the role, responsibilities, and what you're looking for..."
                                className="w-full h-52 px-3 py-2 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                        </>
                    )}

                    {/* ── Step 2: Requirements & Skills ────────────────── */}
                    {step === 2 && (
                        <>
                            <h3 className="text-sm font-semibold">Requirements & Skills</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Requirements (one per line)</label>
                                    <textarea
                                        value={requirements}
                                        onChange={e => setRequirements(e.target.value)}
                                        placeholder={"3+ years of React experience\nStrong TypeScript skills\nExperience with Node.js"}
                                        className="w-full h-28 px-3 py-2 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
                                    <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js, PostgreSQL" className="bg-card" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Min Experience (years)</label>
                                        <Input type="number" min={0} value={expMin} onChange={e => setExpMin(e.target.value)} placeholder="e.g. 2" className="bg-card" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Max Experience (years)</label>
                                        <Input type="number" min={0} value={expMax} onChange={e => setExpMax(e.target.value)} placeholder="e.g. 5" className="bg-card" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Step 3: Settings ─────────────────────────────── */}
                    {step === 3 && (
                        <>
                            <h3 className="text-sm font-semibold">Job Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Visibility</label>
                                    <Select value={visibility} onValueChange={(v) => setVisibility(v as JobVisibility)}>
                                        <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PUBLIC">Public — visible on career portal</SelectItem>
                                            <SelectItem value="PRIVATE">Private — internal only</SelectItem>
                                            <SelectItem value="INVITE_ONLY">Invite Only — link required</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Expiry Date (optional)</label>
                                    <Input
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={e => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                        className="bg-card"
                                    />
                                </div>

                                {/* Application Questions Builder */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs text-muted-foreground">Application Questions</label>
                                        <button
                                            onClick={addQuestion}
                                            className="flex items-center gap-1 text-xs text-accent hover:opacity-80 transition-opacity"
                                        >
                                            <Plus className="w-3 h-3" /> Add Question
                                        </button>
                                    </div>
                                    {questions.length === 0 && (
                                        <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-line rounded-lg">
                                            No custom questions. Candidates will only fill standard fields.
                                        </p>
                                    )}
                                    <div className="space-y-2">
                                        {questions.map((q, i) => (
                                            <div key={q.id} className="p-3 border border-line rounded-lg bg-card space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                                    <Input
                                                        placeholder={`Question ${i + 1} label...`}
                                                        value={q.label}
                                                        onChange={e => updateQuestion(q.id, { label: e.target.value })}
                                                        className="bg-background text-sm flex-1"
                                                    />
                                                    <button onClick={() => removeQuestion(q.id)} className="p-1 text-muted-foreground hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 pl-5">
                                                    <Select value={q.type} onValueChange={(v) => updateQuestion(q.id, { type: v as any })}>
                                                        <SelectTrigger className="bg-background h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {QUESTION_TYPES.map(t => (
                                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={q.required}
                                                            onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                                                            className="rounded"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                                {q.type === 'select' && (
                                                    <div className="pl-5">
                                                        <Input
                                                            placeholder="Options (comma-separated)"
                                                            value={(q.options || []).join(', ')}
                                                            onChange={e => updateQuestion(q.id, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                                                            className="bg-background text-xs h-7"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Step 4: Review ───────────────────────────────── */}
                    {step === 4 && (
                        <>
                            <h3 className="text-sm font-semibold">Review & Create</h3>
                            <div className="space-y-3 text-sm">
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Title</p>
                                    <p className="font-medium">{title}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Department</p>
                                        <p>{department || '—'}</p>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p>{location || '—'}</p>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Type</p>
                                        <p>{employmentType.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Visibility</p>
                                        <p>{visibility.replace('_', ' ')}</p>
                                    </div>
                                    {expiresAt && (
                                        <div className="p-3 bg-muted/20 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Expires</p>
                                            <p>{new Date(expiresAt).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Description</p>
                                    <p className="text-xs text-text-secondary mt-1 line-clamp-3">{description}</p>
                                </div>
                                {skills && (
                                    <div className="p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">Skills</p>
                                        <div className="flex flex-wrap gap-1">{skills.split(',').map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded-full">{s.trim()}</span>
                                        ))}</div>
                                    </div>
                                )}
                                {questions.length > 0 && (
                                    <div className="p-3 bg-muted/20 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">{questions.length} Application Question{questions.length !== 1 ? 's' : ''}</p>
                                        {questions.map((q, i) => (
                                            <p key={q.id} className="text-xs text-text-secondary">• {q.label || `Question ${i + 1}`}{q.required ? ' *' : ''}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : router.back()}
                        className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed}
                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={createMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                            Create Job
                        </button>
                    )}
                </div>
            </div>
            </ErrorBoundary>
        </PageContainer>
    )
}
