"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi, CreateJobInput } from "@/lib/api/jobs"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Loader2, Briefcase, Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const STEPS = ['Basics', 'Description', 'Requirements', 'Review']

export default function CreateJobPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [step, setStep] = useState(0)

    // Form state
    const [title, setTitle] = useState('')
    const [department, setDepartment] = useState('')
    const [location, setLocation] = useState('')
    const [employmentType, setEmploymentType] = useState('FULL_TIME')
    const [description, setDescription] = useState('')
    const [requirements, setRequirements] = useState('')
    const [skills, setSkills] = useState('')

    const createMutation = useMutation({
        mutationFn: (data: CreateJobInput) => jobsApi.create(data),
        onSuccess: () => {
            toast.success('Job created successfully')
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
            router.push('/dashboard/jobs/manage')
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to create job'),
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
            requirements: requirements ? requirements.split('\n').map(r => r.trim()).filter(Boolean) : undefined,
            requiredSkills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        })
    }

    const canProceed = step === 0 ? !!title.trim() : step === 1 ? !!description.trim() : true

    return (
        <PageContainer title="Create Job" description="Create a new job posting and start receiving applications.">
            <div className="mt-6 w-full max-w-2xl mx-auto">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8">
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

                    {step === 1 && (
                        <>
                            <h3 className="text-sm font-semibold">Job Description *</h3>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe the role, responsibilities, and what you're looking for..."
                                className="w-full h-48 px-3 py-2 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                        </>
                    )}

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
                                        className="w-full h-32 px-3 py-2 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
                                    <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js, PostgreSQL" className="bg-card" />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
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
        </PageContainer>
    )
}
