'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, Save } from 'lucide-react'

import { jobsApi, CreateJobInput } from '@/lib/api/jobs'
import {
    DEFAULT_WIZARD_DATA, STEP_LABELS, WEIGHT_PRESETS,
    weightsToDecimal, type WizardData, type Step3Data,
} from './wizard-types'

import { Step1Basics }       from './step-1-basics'
import { Step2Description }  from './step-2-description'
import { Step3Requirements } from './step-3-requirements'
import { Step4Scoring }      from './step-4-scoring'
import { Step5Review }       from './step-5-review'

// ──────────────────────────────────────────────────────────────
// Progress bar
// ──────────────────────────────────────────────────────────────

function WizardProgress({ currentStep }: { currentStep: number }) {
    return (
        <div className="mb-8">
            {/* Step labels */}
            <div className="flex items-center">
                {STEP_LABELS.map((s, i) => {
                    const done    = currentStep > s.step
                    const active  = currentStep === s.step
                    const isLast  = i === STEP_LABELS.length - 1

                    return (
                        <React.Fragment key={s.step}>
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <div className={[
                                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                                    'border-2 transition-all',
                                    done
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : active
                                            ? 'border-primary text-primary bg-primary/10'
                                            : 'border-border text-muted-foreground bg-background',
                                ].join(' ')}>
                                    {done ? <Check className="w-3.5 h-3.5" /> : s.step}
                                </div>
                                <span className={[
                                    'text-[11px] font-medium',
                                    active ? 'text-foreground' : 'text-muted-foreground',
                                ].join(' ')}>
                                    {s.short}
                                </span>
                            </div>
                            {!isLast && (
                                <div className={[
                                    'flex-1 h-0.5 mb-5 mx-1 transition-all',
                                    done ? 'bg-primary' : 'bg-border',
                                ].join(' ')} />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Per-step validation
// ──────────────────────────────────────────────────────────────

function canProceed(step: number, data: WizardData): boolean {
    switch (step) {
        case 1: return data.step1.title.trim().length > 0
        case 2: return data.step2.description.trim().length >= 10
        case 3: {
            const expMax = parseInt(data.step3.expMax)
            const expMin = parseInt(data.step3.expMin) || 0
            const expValid = !data.step3.expMax || expMax >= expMin
            return expValid // skills and expMin are recommended but not blocking for wizard navigation
        }
        case 4: return true
        case 5: return true
        default: return true
    }
}

// ──────────────────────────────────────────────────────────────
// Main Wizard
// ──────────────────────────────────────────────────────────────

export function JobWizard() {
    const router  = useRouter()
    const [step,  setStep]  = React.useState(1)
    const [data,  setData]  = React.useState<WizardData>(DEFAULT_WIZARD_DATA)
    const [saving, setSaving] = React.useState(false)
    const [error,  setError]  = React.useState<string | null>(null)

    const patchStep1 = (patch: Partial<WizardData['step1']>) =>
        setData(d => ({ ...d, step1: { ...d.step1, ...patch } }))
    const patchStep2 = (patch: Partial<WizardData['step2']>) =>
        setData(d => ({ ...d, step2: { ...d.step2, ...patch } }))
    const patchStep3 = (patch: Partial<WizardData['step3']>) =>
        setData(d => ({ ...d, step3: { ...d.step3, ...patch } }))
    const patchStep4 = (patch: Partial<WizardData['step4']>) =>
        setData(d => ({ ...d, step4: { ...d.step4, ...patch } }))

    // When AI parses the JD, pre-fill step3 AND adjust scoring weights by role
    const handleAIParsed = (patch: Partial<Step3Data>) => {
        patchStep3(patch)

        // Apply role-based weight preset if we have a roleType suggestion
        const roleType = patch.roleType
        if (roleType) {
            const roleToPreset: Record<string, WizardData['step4']['preset']> = {
                Frontend:         'skill-heavy',
                Backend:          'skill-heavy',
                Fullstack:        'skill-heavy',
                Management:       'experience-heavy',
                'Data Science':   'balanced',
                'Machine Learning': 'balanced',
                DevOps:           'balanced',
                Design:           'balanced',
            }
            const preset = roleToPreset[roleType] ?? 'balanced'
            patchStep4({ preset, weights: { ...WEIGHT_PRESETS[preset] } })
        }
    }

    const next = () => {
        if (step < 5 && canProceed(step, data)) setStep(s => s + 1)
    }
    const back = () => {
        if (step > 1) setStep(s => s - 1)
    }

    const handleCreate = async () => {
        setSaving(true)
        setError(null)
        try {
            const { step1, step2, step3, step4 } = data
            const w = weightsToDecimal(step4.weights)

            const input: CreateJobInput = {
                title:          step1.title,
                description:    step2.description,
                department:     step1.department    || undefined,
                location:       step1.location      || undefined,
                employmentType: step1.employmentType as any,
                requirements:   step3.requiredSkills, // Mapping UI required skills to ATS generic requirements array
                requiredSkills: step3.requiredSkills,
                optionalSkills: step3.optionalSkills.length > 0 ? step3.optionalSkills : undefined,
                experienceRange: step3.expMin ? {
                    min: parseInt(step3.expMin) || 0,
                    max: parseInt(step3.expMax) || 0,
                } : undefined,
                scoringConfig: {
                    version: 'v2',
                    weights: {
                        skills:      w.skills,
                        experience:  w.experience,
                        projects:    w.projects,
                        education:   w.education,
                        signalBoost: w.signalBoost,
                    },
                    thresholds: {
                        shortlist:  step4.thresholds.shortlist,
                        review:     step4.thresholds.review,
                        autoReject: step4.thresholds.autoReject,
                    },
                    hardGates: {
                        requiredSkills:         step3.requiredSkills.length > 0 ? step3.requiredSkills : undefined,
                        minimumExperienceYears: step3.expMin ? parseInt(step3.expMin) : undefined,
                        requiredEducationLevel: step3.educationLevel || undefined,
                    },
                },
            }

            const res = await jobsApi.create(input)
            if (res.success && res.data) {
                router.push('/dashboard/manage-jobs')
            } else {
                const msg = res.error?.message || 'Failed to create job'
                setError(msg)
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create job')
        } finally {
            setSaving(false)
        }
    }

    const proceed = canProceed(step, data)

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-foreground">Create New Job Post</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Step {step} of 5 — {STEP_LABELS[step - 1].label}
                </p>
            </div>

            {/* Progress */}
            <WizardProgress currentStep={step} />

            {/* Step content */}
            <div className="min-h-[420px]">
                {step === 1 && <Step1Basics       data={data.step1} onChange={patchStep1} />}
                {step === 2 && <Step2Description  data={data.step2} onChange={patchStep2} onAIParsed={handleAIParsed} />}
                {step === 3 && <Step3Requirements data={data.step3} onChange={patchStep3} />}
                {step === 4 && <Step4Scoring      data={data.step4} onChange={patchStep4} />}
                {step === 5 && <Step5Review       data={data} saving={saving} error={error} />}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
                <button
                    type="button"
                    onClick={back}
                    disabled={step === 1}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    {step < 5 ? (
                        <button
                            type="button"
                            onClick={next}
                            disabled={!proceed}
                            title={!proceed ? 'Complete required fields to continue' : undefined}
                            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                        >
                            Continue
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Creating...' : 'Create Draft Job'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
