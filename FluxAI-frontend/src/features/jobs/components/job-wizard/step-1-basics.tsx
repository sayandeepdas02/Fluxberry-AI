'use client'

import * as React from 'react'
import { Building2, MapPin, Briefcase, Globe } from 'lucide-react'
import type { Step1Data, EmploymentType, RemoteOption } from './wizard-types'

interface Props {
    data:     Step1Data
    onChange: (patch: Partial<Step1Data>) => void
}

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT',  label: 'Contract'  },
    { value: 'INTERN',    label: 'Internship' },
    { value: 'OTHER',     label: 'Other'     },
]

const REMOTE_OPTIONS: { value: RemoteOption; label: string; description: string }[] = [
    { value: 'ONSITE', label: 'On-site',     description: 'Candidates must work from office'  },
    { value: 'REMOTE', label: 'Remote',      description: 'Fully remote position'              },
    { value: 'HYBRID', label: 'Hybrid',      description: 'Mix of remote and on-site'         },
]

export function Step1Basics({ data, onChange }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Role Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Basic information about the position. This appears on the public job listing.
                </p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                    Job Title <span className="text-red-500">*</span>
                </label>
                <input
                    id="step1-title"
                    type="text"
                    value={data.title}
                    onChange={e => onChange({ title: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
            </div>

            {/* Department + Employment Type */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        Department
                    </label>
                    <input
                        type="text"
                        value={data.department}
                        onChange={e => onChange({ department: e.target.value })}
                        placeholder="e.g. Engineering"
                        className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        Employment Type
                    </label>
                    <select
                        value={data.employmentType}
                        onChange={e => onChange({ employmentType: e.target.value as EmploymentType })}
                        className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        {EMPLOYMENT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Location
                </label>
                <input
                    type="text"
                    value={data.location}
                    onChange={e => onChange({ location: e.target.value })}
                    placeholder="e.g. San Francisco, CA or New York"
                    className="w-full h-10 px-3 text-sm border border-input bg-background text-foreground rounded-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                />
            </div>

            {/* Remote option */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    Work Arrangement
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {REMOTE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange({ remoteOption: opt.value })}
                            className={[
                                'flex flex-col items-start gap-0.5 px-4 py-3 text-left border rounded-none transition-all',
                                data.remoteOption === opt.value
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-input hover:border-primary/40 text-foreground',
                            ].join(' ')}
                        >
                            <span className="text-sm font-medium">{opt.label}</span>
                            <span className="text-[11px] text-muted-foreground leading-tight">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
