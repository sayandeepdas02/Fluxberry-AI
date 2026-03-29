export interface ExperienceItem {
    id: string;
    company: string;
    role: string;
    years: number;
    description: string;
    current: boolean;
}

export interface ProspectCandidate {
    id: string;
    name: string;
    avatarUrl?: string;
    skills: string[];
    experience: ExperienceItem[];
    location: string;
    matchScore: number;
    email: string | null;      // Null until unlocked via credits
    linkedin: string | null;   // Null until unlocked
    unlocked: boolean;
    aiSummary: {
        strengths: string[];
        fit: string;
    };
    recentActivity?: string; 
    savedToListId?: string | null;
}

export interface SearchFilters {
    query: string;
    skills: string[];
    location: string[];
    minExperience: number;
    maxExperience: number;
    matchThreshold: number;
    companies: string[];
}
