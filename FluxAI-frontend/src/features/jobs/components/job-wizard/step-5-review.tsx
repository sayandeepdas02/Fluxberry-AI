'use client'

import * as React from 'react'
import {
    CheckCircle2, AlertTriangle, Briefcase, MapPin, Users,
    BarChart3, ShieldCheck, Sparkles
} from 'lucide-react'
import type { WizardData } from './wizard-types'
import { weightsToDecimal } from './wizard-types'

interface Props {
    data:     WizardData
    saving:   boolean
    error:    string | null
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-border rounded-none overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            </div>
            <div className="px-4 py-4 space-y-3">{children}</div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-muted-foreground flex-shrink-0">{label}</span>
            <span className="text-foreground text-right font-medium">{value || '—'}</span>
        </div>
    )
}

function Chip({ label, variant = 'required' }: { label: string; variant?: 'required' | 'optional' }) {
    return (
        <span className={[
            'inline-flex items-center px-2 py-0.5 text-xs rounded-sm font-medium border',
            variant === 'required'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted text-muted-foreground border-border',
        ].join(' ')}>
            {label}
        </span>
    )
}

const EMP_LABELS: Record<string, string> = {
    FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract',
    INTERN: 'Internship', OTHER: 'Other',
}
const REMOTE_LABELS: Record<string, string> = {
    ONSITE: 'On-site', REMOTE: 'Remote', HYBRID: 'Hybrid'
}

export function Step5Review({ data, saving, error }: Props) {
    const { step1, step2, step3, step4 } = data
    const weights = weightsToDecimal(step4.weights)

    const hasRequiredSkills = step3.requiredSkills.length > 0
    const hasExpMin = step3.expMin !== ''
    const readyToPublish = hasRequiredSkills && hasExpMin

    // Build ATS behavior preview strings
    const topSkills = step3.requiredSkills.slice(0, 3).join(', ')
    const expMin    = step3.expMin ? `${step3.expMin}+` : 'any'
    const shortlistThreshold = step4.thresholds.shortlist

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Review & Create</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Review all details before creating the draft job post. You can always edit it later.
                </p>
            </div>

            {/* Publish gate warnings */}
            {!readyToPublish && (
                <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3 rounded-none">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                            This job can be saved as draft but cannot be published yet:
                        </p>
                        {!hasRequiredSkills && <p>· Add at least 1 required skill in Step 3</p>}
                        {!hasExpMin && <p>· Set a minimum experience range in Step 3</p>}
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-2 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Job info */}
            <SectionCard title="Role Basics">
                <Row label="Title"              value={step1.title}                           />
                <Row label="Department"         value={step1.department}                      />
                <Row label="Employment"         value={EMP_LABELS[step1.employmentType]}      />
                <Row label="Location"           value={step1.location}                        />
                <Row label="Work arrangement"   value={REMOTE_LABELS[step1.remoteOption]}     />
                {step2.aiApplied && (
                    <div className="flex items-center gap-1.5 text-xs text-primary mt-1">
                        <Sparkles className="w-3 h-3" />
                        Requirements extracted via AI
                    </div>
                )}
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skills & Requirements">
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Required skills (hard gates)</p>
                    <div className="flex flex-wrap gap-1.5">
                        {step3.requiredSkills.length > 0
                            ? step3.requiredSkills.map(s => <Chip key={s} label={s} variant="required" />)
                            : <span className="text-xs text-amber-500">None added — publish will be blocked</span>}
                    </div>
                </div>
                {step3.optionalSkills.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Optional skills (score boost)</p>
                        <div className="flex flex-wrap gap-1.5">
                            {step3.optionalSkills.map(s => <Chip key={s} label={s} variant="optional" />)}
                        </div>
                    </div>
                )}
                <Row
                    label="Experience range"
                    value={step3.expMin || step3.expMax
                        ? `${step3.expMin || '0'}–${step3.expMax || '∞'} years`
                        : 'Not set'}
                />
                {step3.educationLevel && (
                    <Row label="Education" value={step3.educationLevel} />
                )}
            </SectionCard>

            {/* Scoring weights visual */}
            <SectionCard title="ATS Scoring Weights">
                <div className="space-y-2">
                    {([
                        { key: 'skills',      label: 'Skills',       color: 'bg-blue-500'    },
                        { key: 'experience',  label: 'Experience',   color: 'bg-violet-500'  },
                        { key: 'projects',    label: 'Projects',     color: 'bg-cyan-500'    },
                        { key: 'education',   label: 'Education',    color: 'bg-amber-500'   },
                        { key: 'signalBoost', label: 'Signal Boost', color: 'bg-emerald-500' },
                    ] as const).map(row => {
                        const pct = Math.round((weights[row.key as keyof typeof weights] || 0) * 100)
                        return (
                            <div key={row.key} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{row.label}</span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-medium tabular-nums w-8 text-right">{pct}%</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex gap-4 mt-1 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>Shortlist ≥ <strong className="text-emerald-500">{step4.thresholds.shortlist}</strong></span>
                    <span>Review ≥ <strong className="text-amber-500">{step4.thresholds.review}</strong></span>
                    <span>Reject &lt; <strong className="text-red-500">{step4.thresholds.autoReject || step4.thresholds.review}</strong></span>
                </div>
            </SectionCard>

            {/* ATS Behavior Preview */}
            <div className="border border-primary/20 bg-primary/5 rounded-none overflow-hidden">
                <div className="px-4 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">ATS Behavior Preview</p>
                </div>
                <div className="px-4 py-4 space-y-2 text-xs text-muted-foreground">
                    {hasRequiredSkills ? (
                        <>
                            <div className="flex items-start gap-2">
                                <span className="text-emerald-500 flex-shrink-0">✓</span>
                                <span>
                                    Candidates with <strong className="text-foreground">{topSkills}</strong>
                                    {step3.requiredSkills.length > 3 ? ` and ${step3.requiredSkills.length - 3} more` : ''} + {expMin} years experience
                                    → likely <strong className="text-emerald-500">SHORTLISTED</strong> (score ≥ {shortlistThreshold})
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-amber-500 flex-shrink-0">~</span>
                                <span>
                                    Candidates with partial skill match → <strong className="text-amber-500">REVIEW</strong> (score {step4.thresholds.review}–{shortlistThreshold - 1})
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-red-500 flex-shrink-0">✗</span>
                                <span>
                                    Candidates missing <strong className="text-foreground">{step3.requiredSkills[0]}</strong>
                                    {step3.requiredSkills.length > 1 ? ' or other required skills' : ''} → <strong className="text-red-500">AUTO-REJECTED</strong> (hard gate fail)
                                </span>
                            </div>
                            {step3.expMin && (
                                <div className="flex items-start gap-2">
                                    <span className="text-red-500 flex-shrink-0">✗</span>
                                    <span>
                                        Candidates with &lt;{step3.expMin} years experience → <strong className="text-red-500">AUTO-REJECTED</strong> (experience gate)
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-amber-500">
                            Add required skills in Step 3 to see ATS behavior preview
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
