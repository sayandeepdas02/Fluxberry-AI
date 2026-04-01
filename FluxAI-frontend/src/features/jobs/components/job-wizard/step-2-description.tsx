'use client'

import * as React from 'react'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
import { useJobParser } from '../../hooks/use-job-parser'
import type { Step2Data, Step3Data } from './wizard-types'

interface Props {
    data:     Step2Data
    onChange: (patch: Partial<Step2Data>) => void
    /** Called when AI parse succeeds — used to pre-fill step 3 */
    onAIParsed: (patch: Partial<Step3Data>) => void
}

export function Step2Description({ data, onChange, onAIParsed }: Props) {
    const { parse, loading, error, result } = useJobParser()
    const [charCount, setCharCount] = React.useState(data.description.length)

    const handleDescriptionChange = (val: string) => {
        onChange({ description: val, aiApplied: false })
        setCharCount(val.length)
    }

    const handleParse = async () => {
        if (data.description.length < 50) return
        const parsed = await parse(data.description)
        if (parsed) {
            onAIParsed({
                requiredSkills: parsed.requiredSkills,
                optionalSkills: parsed.optionalSkills,
                expMin:         parsed.experienceRange.min.toString(),
                expMax:         parsed.experienceRange.max.toString(),
                educationLevel: (parsed.educationLevel as any) ?? '',
                roleType:       parsed.roleType,
            })
            onChange({ aiApplied: true })
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Job Description</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Paste your full job description. Our AI will extract skills, experience requirements,
                    and role type — saving you time in Step 3.
                </p>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                        Job Description <span className="text-red-500">*</span>
                    </label>
                    <span className={[
                        'text-xs tabular-nums',
                        charCount > 4800 ? 'text-red-500' : 'text-muted-foreground',
                    ].join(' ')}>
                        {charCount} / 5000
                    </span>
                </div>
                <textarea
                    id="step2-description"
                    value={data.description}
                    onChange={e => handleDescriptionChange(e.target.value)}
                    rows={12}
                    placeholder="Paste your full job description here...

We are looking for a Senior Frontend Engineer to join our team. The ideal candidate will have 3+ years of experience with React, TypeScript, and modern web technologies..."
                    className="w-full px-3 py-2.5 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed"
                    maxLength={5000}
                />
            </div>

            {/* AI Parse Button */}
            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    disabled={loading || data.description.length < 50}
                    onClick={handleParse}
                    className={[
                        'relative inline-flex items-center justify-center gap-2.5 w-full h-11 px-6',
                        'text-sm font-medium rounded-none transition-all',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        loading
                            ? 'bg-primary/80 text-primary-foreground cursor-wait'
                            : data.description.length < 50
                                ? 'bg-muted text-muted-foreground border border-input'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
                    ].join(' ')}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing job description...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Parse with AI — Auto-fill Requirements
                            <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                        </>
                    )}
                </button>

                {data.description.length < 50 && data.description.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                        Add at least {50 - data.description.length} more characters to enable AI parsing
                    </p>
                )}

                {data.description.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                        Paste a job description above to enable AI parsing, or fill Step 3 manually
                    </p>
                )}
            </div>

            {/* Success state */}
            {data.aiApplied && result && (
                <div className="rounded-none border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        AI extraction complete — Step 3 has been pre-filled
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div>
                            <span className="font-medium text-foreground">Role type:</span>{' '}
                            {result.roleType || '—'}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Seniority:</span>{' '}
                            {result.seniorityLevel || '—'}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Required skills:</span>{' '}
                            {result.requiredSkills.length} detected
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Experience:</span>{' '}
                            {result.experienceRange.min}–{result.experienceRange.max} years
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        All extracted data can be edited in Step 3. Weight presets were also adjusted for this role type.
                    </p>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="flex items-start gap-2 rounded-none border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error} — You can continue manually in Step 3.</span>
                </div>
            )}
        </div>
    )
}
