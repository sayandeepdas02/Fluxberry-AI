'use client'

import * as React from 'react'
import { X, Zap, AlertTriangle } from 'lucide-react'
import { jobsApi } from '@/lib/api/jobs'
import type { Step3Data, EducationLevel } from './wizard-types'

interface Props {
    data:     Step3Data
    onChange: (patch: Partial<Step3Data>) => void
}

const EDUCATION_LEVELS: { value: EducationLevel | ''; label: string }[] = [
    { value: '',           label: 'Not specified' },
    { value: 'None',       label: 'No requirement'  },
    { value: 'Diploma',    label: 'Diploma'          },
    { value: "Bachelor's", label: "Bachelor's degree" },
    { value: "Master's",   label: "Master's degree"  },
    { value: 'PhD',        label: 'PhD'              },
]

// ──────────────────────────────────────────────────────────────
// ChipInput with autocomplete
// ──────────────────────────────────────────────────────────────

function SkillChipInput({
    id, value, onChange, placeholder, roleType
}: {
    id: string; value: string[]; onChange: (v: string[]) => void
    placeholder?: string; roleType?: string
}) {
    const [input,       setInput]       = React.useState('')
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const [showSug,     setShowSug]     = React.useState(false)
    const [fetchTimer,  setFetchTimer]  = React.useState<ReturnType<typeof setTimeout> | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const fetchSuggestions = React.useCallback(async (q: string) => {
        try {
            const res = await jobsApi.skillSuggestions(q, roleType)
            if (res.success && res.data) {
                // Exclude already-added skills
                setSuggestions(res.data.filter(s => !value.includes(s)))
            }
        } catch { /* silent */ }
    }, [roleType, value])

    const handleInputChange = (val: string) => {
        setInput(val)
        setShowSug(true)
        if (fetchTimer) clearTimeout(fetchTimer)
        setFetchTimer(setTimeout(() => fetchSuggestions(val), 280))
    }

    const addChip = (raw: string) => {
        const chips = raw.split(',').map(s => s.trim()).filter(Boolean)
        const next = Array.from(new Set([...value, ...chips]))
        onChange(next)
        setInput('')
        setSuggestions([])
        setShowSug(false)
        inputRef.current?.focus()
    }

    const removeChip = (chip: string) => onChange(value.filter(c => c !== chip))

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (input.trim()) addChip(input)
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            onChange(value.slice(0, -1))
        } else if (e.key === 'Escape') {
            setShowSug(false)
        }
    }

    // Close suggestions on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setShowSug(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={containerRef} className="relative">
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
                    onChange={e => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { fetchSuggestions(input); setShowSug(true) }}
                    onBlur={e => {
                        // Delay to allow suggestion click
                        setTimeout(() => {
                            if (!containerRef.current?.contains(document.activeElement)) {
                                setShowSug(false)
                                if (input.trim()) addChip(input)
                            }
                        }, 150)
                    }}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
            </div>

            {/* Autocomplete dropdown */}
            {showSug && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-0.5 border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
                    {suggestions.map(s => (
                        <button
                            key={s}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); addChip(s) }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ──────────────────────────────────────────────────────────────
// Step 3
// ──────────────────────────────────────────────────────────────

export function Step3Requirements({ data, onChange }: Props) {
    const expMinNum = parseInt(data.expMin) || 0
    const expMaxNum = parseInt(data.expMax) || 0
    const expValid  = !data.expMax || expMaxNum >= expMinNum

    const hasRequiredSkills = data.requiredSkills.length > 0
    const hasExp = data.expMin !== ''

    return (
        <div className="space-y-7">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    These fields directly control ATS scoring — higher quality here means higher screening accuracy.
                </p>
            </div>

            {/* ATS Awareness banner */}
            <div className="flex items-start gap-3 border border-primary/25 bg-primary/5 px-4 py-3 rounded-none">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                    <p>
                        <span className="font-medium text-foreground">Required skills</span> are hard gates —
                        candidates missing them are automatically rejected regardless of score.
                    </p>
                    <p>
                        <span className="font-medium text-foreground">Optional skills</span> boost score but are not blockers.
                        <span className="font-medium text-foreground"> Minimum experience</span> is also a hard gate.
                    </p>
                </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="req-skills">
                    Required Skills <span className="text-red-500">*</span>
                    {' '}<span className="text-xs font-normal text-muted-foreground">(press Enter or comma to add)</span>
                </label>
                <SkillChipInput
                    id="req-skills"
                    value={data.requiredSkills}
                    onChange={v => onChange({ requiredSkills: v })}
                    placeholder="e.g. React, TypeScript, Node.js..."
                    roleType={data.roleType}
                />
                {!hasRequiredSkills && (
                    <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        At least 1 required skill is needed for ATS screening to work
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    {data.requiredSkills.length} skill{data.requiredSkills.length !== 1 ? 's' : ''} added
                    {data.requiredSkills.length > 0 && ' · click × to remove'}
                </p>
            </div>

            {/* Optional Skills */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="opt-skills">
                    Optional Skills
                    {' '}<span className="text-xs font-normal text-muted-foreground">(nice-to-have)</span>
                </label>
                <SkillChipInput
                    id="opt-skills"
                    value={data.optionalSkills}
                    onChange={v => onChange({ optionalSkills: v })}
                    placeholder="e.g. GraphQL, Redis, Docker..."
                    roleType={data.roleType}
                />
                <p className="text-xs text-muted-foreground">
                    These increase a candidate's score but won't block them from passing
                </p>
            </div>

            {/* Experience Range */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Years of Experience <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                        <span className="text-xs text-muted-foreground">Minimum (hard gate)</span>
                        <input
                            type="number"
                            id="exp-min"
                            value={data.expMin}
                            onChange={e => onChange({ expMin: e.target.value })}
                            min="0" max="30" placeholder="0"
                            className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>
                    <span className="text-muted-foreground text-sm pt-5">–</span>
                    <div className="flex-1 space-y-1">
                        <span className="text-xs text-muted-foreground">Maximum (preferred)</span>
                        <input
                            type="number"
                            id="exp-max"
                            value={data.expMax}
                            onChange={e => onChange({ expMax: e.target.value })}
                            min="0" max="30" placeholder="5"
                            className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>
                </div>
                {!expValid && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Maximum must be ≥ minimum
                    </p>
                )}
                {!hasExp && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Minimum experience is required for the hard gate check
                    </p>
                )}
            </div>

            {/* Education */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                    Minimum Education Level
                    {' '}<span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </label>
                <select
                    value={data.educationLevel}
                    onChange={e => onChange({ educationLevel: e.target.value as any })}
                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    {EDUCATION_LEVELS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}
