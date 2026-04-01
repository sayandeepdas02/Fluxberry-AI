/**
 * Shared types for the Job Creation Wizard.
 * This is the single data model carried across all 5 steps.
 */

export interface WizardScoringWeights {
    skills:      number  // 0–100 (displayed as %)
    experience:  number
    projects:    number
    education:   number
    signalBoost: number
}

export interface WizardScoringThresholds {
    shortlist:  number  // 0–100
    review:     number
    autoReject: number
}

export type RemoteOption = 'ONSITE' | 'REMOTE' | 'HYBRID'
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'OTHER'
export type EducationLevel = "Bachelor's" | "Master's" | 'PhD' | 'Diploma' | 'None'

// ──────────────────────────────────────────────────────────────
// Per-step slices
// ──────────────────────────────────────────────────────────────

export interface Step1Data {
    title:          string
    department:     string
    employmentType: EmploymentType
    location:       string
    remoteOption:   RemoteOption
}

export interface Step2Data {
    description: string
    /** AI parse was applied and these were extracted */
    aiApplied:   boolean
}

export interface Step3Data {
    requiredSkills:  string[]
    optionalSkills:  string[]
    expMin:          string
    expMax:          string
    educationLevel:  EducationLevel | ''
    roleType:        string   // from AI or manual
}

export interface Step4Data {
    weights:    WizardScoringWeights
    thresholds: WizardScoringThresholds
    preset:     'balanced' | 'skill-heavy' | 'experience-heavy' | 'custom'
}

// ──────────────────────────────────────────────────────────────
// Full wizard state
// ──────────────────────────────────────────────────────────────

export interface WizardData {
    step1: Step1Data
    step2: Step2Data
    step3: Step3Data
    step4: Step4Data
}

// ──────────────────────────────────────────────────────────────
// Presets
// ──────────────────────────────────────────────────────────────

export const WEIGHT_PRESETS: Record<Step4Data['preset'], WizardScoringWeights> = {
    balanced:          { skills: 35, experience: 25, projects: 20, education: 15, signalBoost: 5 },
    'skill-heavy':     { skills: 50, experience: 20, projects: 15, education: 10, signalBoost: 5 },
    'experience-heavy':{ skills: 20, experience: 45, projects: 15, education: 15, signalBoost: 5 },
    custom:            { skills: 35, experience: 25, projects: 20, education: 15, signalBoost: 5 },
}

export const DEFAULT_WIZARD_DATA: WizardData = {
    step1: {
        title: '',
        department: '',
        employmentType: 'FULL_TIME',
        location: '',
        remoteOption: 'ONSITE',
    },
    step2: {
        description: '',
        aiApplied: false,
    },
    step3: {
        requiredSkills: [],
        optionalSkills: [],
        expMin: '',
        expMax: '',
        educationLevel: '',
        roleType: '',
    },
    step4: {
        weights: WEIGHT_PRESETS.balanced,
        thresholds: { shortlist: 80, review: 60, autoReject: 0 },
        preset: 'balanced',
    },
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export const STEP_LABELS = [
    { step: 1, label: 'Role Basics',    short: 'Basics'  },
    { step: 2, label: 'Description',    short: 'JD'      },
    { step: 3, label: 'Requirements',   short: 'Skills'  },
    { step: 4, label: 'ATS Scoring',    short: 'Scoring' },
    { step: 5, label: 'Review',         short: 'Review'  },
]

export function weightsSum(w: WizardScoringWeights): number {
    return w.skills + w.experience + w.projects + w.education + w.signalBoost
}

export function weightsToDecimal(w: WizardScoringWeights) {
    const total = weightsSum(w) || 100
    return {
        skills:      w.skills      / total,
        experience:  w.experience  / total,
        projects:    w.projects    / total,
        education:   w.education   / total,
        signalBoost: w.signalBoost / total,
    }
}
