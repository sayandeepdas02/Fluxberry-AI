'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import type { Step4Data, WizardScoringWeights, WEIGHT_PRESETS } from './wizard-types'
import { weightsSum, WEIGHT_PRESETS as PRESETS } from './wizard-types'

interface Props {
    data:     Step4Data
    onChange: (patch: Partial<Step4Data>) => void
}

type PresetKey = Step4Data['preset']

const PRESET_LABELS: { key: PresetKey; label: string; description: string }[] = [
    { key: 'balanced',          label: 'Balanced',          description: '35% skills, 25% exp, 20% projects' },
    { key: 'skill-heavy',       label: 'Skill-Heavy',       description: '50% skills — tech roles'           },
    { key: 'experience-heavy',  label: 'Experience-Heavy',  description: '45% experience — senior roles'     },
    { key: 'custom',            label: 'Custom',            description: 'Set your own weights'              },
]

const WEIGHT_KEYS: { key: keyof WizardScoringWeights; label: string; description: string; color: string }[] = [
    { key: 'skills',      label: 'Skills',      description: 'Technical skill match against required list', color: 'bg-blue-500'   },
    { key: 'experience',  label: 'Experience',  description: 'Years of relevant experience',               color: 'bg-violet-500' },
    { key: 'projects',    label: 'Projects',    description: 'Portfolio & side project quality',           color: 'bg-cyan-500'   },
    { key: 'education',   label: 'Education',   description: 'Degree level and institution',               color: 'bg-amber-500'  },
    { key: 'signalBoost', label: 'Signal Boost',description: 'Bonus for optional skills & achievements',  color: 'bg-emerald-500'},
]

function WeightSlider({
    label, description, color, value, onChange, disabled,
}: {
    label: string; description: string; color: string
    value: number; onChange: (v: number) => void; disabled: boolean
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums w-10 text-right">
                    {value}%
                </span>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <input
                        type="range"
                        min="0" max="100" step="5"
                        value={value}
                        onChange={e => onChange(Number(e.target.value))}
                        disabled={disabled}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted disabled:cursor-not-allowed"
                        style={{
                            background: `linear-gradient(to right, var(--primary) ${value}%, var(--muted) ${value}%)`,
                        }}
                    />
                </div>
            </div>
            {/* Visual bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    )
}

export function Step4Scoring({ data, onChange }: Props) {
    const sum = weightsSum(data.weights)
    const isCustom = data.preset === 'custom'
    const sumOk = Math.abs(sum - 100) <= 2   // ±2% tolerance

    const applyPreset = (key: PresetKey) => {
        onChange({
            preset: key,
            weights: key === 'custom' ? data.weights : { ...PRESETS[key] },
        })
    }

    const updateWeight = (key: keyof WizardScoringWeights, value: number) => {
        onChange({
            preset: 'custom',
            weights: { ...data.weights, [key]: value },
        })
    }

    return (
        <div className="space-y-7">
            <div>
                <h2 className="text-lg font-semibold text-foreground">ATS Scoring Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Define how candidates are ranked. Weights control the importance of each dimension.
                    Thresholds decide who gets shortlisted, reviewed, or rejected.
                </p>
            </div>

            {/* Preset selector */}
            <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">Scoring Preset</label>
                <div className="grid grid-cols-2 gap-2">
                    {PRESET_LABELS.map(p => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => applyPreset(p.key)}
                            className={[
                                'flex flex-col items-start gap-0.5 px-4 py-3 text-left border rounded-none transition-all',
                                data.preset === p.key
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-input hover:border-primary/40 text-foreground',
                            ].join(' ')}
                        >
                            <span className="text-sm font-medium">{p.label}</span>
                            <span className="text-[11px] text-muted-foreground">{p.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Weight sliders */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Scoring Weights</label>
                    <div className={[
                        'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                        sumOk
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-500',
                    ].join(' ')}>
                        <span className="tabular-nums">{sum}%</span>
                        <span>{sumOk ? '✓ balanced' : '≠ 100%'}</span>
                    </div>
                </div>

                <div className="space-y-5 pl-0">
                    {WEIGHT_KEYS.map(wk => (
                        <WeightSlider
                            key={wk.key}
                            label={wk.label}
                            description={wk.description}
                            color={wk.color}
                            value={data.weights[wk.key]}
                            onChange={v => updateWeight(wk.key, v)}
                            disabled={false}
                        />
                    ))}
                </div>

                {!sumOk && (
                    <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        Weights should sum to 100%. Currently {sum}%. 
                        The system will normalize them automatically, but it's best to balance them manually.
                    </div>
                )}
            </div>

            {/* Thresholds */}
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">Decision Thresholds</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Score boundaries (0–100) that determine how candidates are categorized
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { key: 'shortlist' as const,  label: 'Shortlist',   color: 'text-emerald-500', hint: 'Score ≥ this → SHORTLISTED' },
                        { key: 'review' as const,     label: 'Review',      color: 'text-amber-500',   hint: 'Score ≥ this → REVIEW'      },
                        { key: 'autoReject' as const, label: 'Auto-Reject', color: 'text-red-500',     hint: 'Score < this → REJECTED'    },
                    ].map(({ key, label, color, hint }) => (
                        <div key={key} className="space-y-1.5">
                            <div>
                                <label className={`text-sm font-medium ${color}`}>{label}</label>
                                <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={data.thresholds[key]}
                                    onChange={e => onChange({
                                        thresholds: { ...data.thresholds, [key]: Math.max(0, Math.min(100, Number(e.target.value))) }
                                    })}
                                    min="0" max="100"
                                    className="w-full h-10 px-3 pr-8 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
