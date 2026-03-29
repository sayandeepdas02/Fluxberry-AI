import { useState, useMemo } from 'react';
import { ProspectCandidate, SearchFilters } from '../types';

// Large static mock database mimicking Apollo's global search index
const MOCK_PROSPECTS: ProspectCandidate[] = [
    {
        id: 'p-1',
        name: 'Sarah Chen',
        skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
        experience: [
            { id: 'e1', company: 'TechFlow (Startup)', role: 'Senior Frontend Engineer', years: 3, current: true, description: 'Led frontend architecture for core platform.' }
        ],
        location: 'Bangalore, India',
        matchScore: 94,
        email: 'sarah.chen.dev@gmail.com',
        linkedin: 'linkedin.com/in/sarahchen88',
        unlocked: false,
        aiSummary: {
            strengths: ['Deep React expertise', 'Startup proven', 'Full-stack capable'],
            fit: 'Perfect match for Senior React Developer role. Exactly 3 years startup experience.'
        }
    },
    {
        id: 'p-2',
        name: 'Marcus Johnson',
        skills: ['React', 'Next.js', 'Tailwind', 'AWS'],
        experience: [
            { id: 'e2', company: 'Enterprise Corp', role: 'Frontend Lead', years: 5, current: true, description: 'Managing team of 6 UI developers.' },
            { id: 'e3', company: 'WebAgency', role: 'Web Developer', years: 2, current: false, description: 'Client projects.' }
        ],
        location: 'Remote, US',
        matchScore: 88,
        email: 'mjohnson.ui@icloud.com',
        linkedin: 'linkedin.com/in/mjui',
        unlocked: false,
        aiSummary: {
            strengths: ['Leadership experience', 'Next.js heavy', 'Design systems'],
            fit: 'Strong technical fit, but primarily enterprise background vs startup.'
        }
    },
    {
        id: 'p-3',
        name: 'Aisha Patel',
        skills: ['Vue', 'React', 'JavaScript', 'Python'],
        experience: [
            { id: 'e4', company: 'DataStack', role: 'Full Stack Engineer', years: 4, current: true, description: 'Built internal tools using Vue and React.' }
        ],
        location: 'London, UK',
        matchScore: 72,
        email: 'apatel92@protonmail.com',
        linkedin: 'linkedin.com/in/aishap',
        unlocked: false,
        aiSummary: {
            strengths: ['Polyglot developer', 'Strong backend fundamentals'],
            fit: 'Mixed frontend framework experience. Good potential.'
        }
    },
    {
        id: 'p-4',
        name: 'David Kim',
        skills: ['React', 'React Native', 'TypeScript', 'Redux'],
        experience: [
            { id: 'e5', company: 'MobileFirst', role: 'Mobile Engineer', years: 2, current: true, description: 'Cross-platform app development.' }
        ],
        location: 'Bangalore, India',
        matchScore: 65,
        email: 'dkim.dev@gmail.com',
        linkedin: 'linkedin.com/in/dkimmobile',
        unlocked: false,
        aiSummary: {
            strengths: ['Mobile focused', 'React Native specialist'],
            fit: 'Location match, but mobile focused rather than web.'
        }
    },
    {
        id: 'p-5',
        name: 'Elena Rodriguez',
        skills: ['React', 'Redux', 'Jest', 'Webpack'],
        experience: [
            { id: 'e6', company: 'SaaS Innovate', role: 'Frontend Engineer', years: 3, current: true, description: 'Core product team.' }
        ],
        location: 'Austin, TX',
        matchScore: 91,
        email: 'elena.r.codes@gmail.com',
        linkedin: 'linkedin.com/in/erodcodes',
        unlocked: false,
        aiSummary: {
            strengths: ['SaaS product experience', 'Testing focus', 'Modern stack'],
            fit: 'Excellent fit for core product engineering requirements.'
        }
    }
];

const DEFAULT_FILTERS: SearchFilters = {
    query: '',
    skills: [],
    location: [],
    minExperience: 0,
    maxExperience: 20,
    matchThreshold: 0,
    companies: []
};

export function useTalentSearch() {
    const [db, setDb] = useState<ProspectCandidate[]>(MOCK_PROSPECTS);
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [credits, setCredits] = useState<number>(15);
    const [isSearching, setIsSearching] = useState(false);

    // Dynamic AI Query translation mock
    const handleAIQuery = (query: string) => {
        setIsSearching(true);
        // Simulate network delay for AI analysis
        setTimeout(() => {
            const lower = query.toLowerCase();
            const newFilters = { ...DEFAULT_FILTERS, query };
            
            // Dumb AI extraction
            if (lower.includes('react')) newFilters.skills.push('React');
            if (lower.includes('node')) newFilters.skills.push('Node.js');
            if (lower.includes('bangalore')) newFilters.location.push('Bangalore');
            if (lower.includes('startup')) newFilters.companies.push('Startup');
            
            // Extract years if mentioned like "3 yrs" or "3 years"
            const match = query.match(/(\d+)\+?\s*y/);
            if (match) {
                newFilters.minExperience = parseInt(match[1]);
            }

            setFilters(newFilters);
            setIsSearching(false);
        }, 600);
    };

    // Client-side filtering engine
    const results = useMemo(() => {
        if (!filters) return db;

        return db.filter(candidate => {
            // General text query (Name or Role)
            if (filters.query && !handleAIQuery) {
                const searchStr = `${candidate.name} ${candidate.experience.map(e => e.role).join(' ')}`.toLowerCase();
                if (!searchStr.includes(filters.query.toLowerCase())) return false;
            }

            // Location
            if (filters.location.length > 0) {
                const matchesLoc = filters.location.some(l => candidate.location.toLowerCase().includes(l.toLowerCase()));
                if (!matchesLoc) return false;
            }

            // Skills intersection
            if (filters.skills.length > 0) {
                const hasSkills = filters.skills.every(skill => 
                    candidate.skills.some(cSkill => cSkill.toLowerCase() === skill.toLowerCase())
                );
                if (!hasSkills) return false;
            }

            // Experience summation
            const totalYears = candidate.experience.reduce((sum, e) => sum + e.years, 0);
            if (totalYears < filters.minExperience || totalYears > filters.maxExperience) return false;

            // Match Score Threshold
            if (candidate.matchScore < filters.matchThreshold) return false;

            return true;
        }).sort((a, b) => b.matchScore - a.matchScore);
    }, [db, filters]);

    const unlockProfile = async (id: string): Promise<boolean> => {
        if (credits < 1) return false;
        
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                setCredits(c => c - 1);
                setDb(prev => prev.map(p => 
                    p.id === id ? { ...p, unlocked: true } : p
                ));
                resolve(true);
            }, 400);
        });
    };

    const pushToATS = async (id: string, jobId: string) => {
        // Mock pushing candidate directly to ATS pool
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, message: 'Prospect transferred to active pipeline.'});
            }, 600);
        });
    };

    return {
        results,
        filters,
        setFilters,
        handleAIQuery,
        isSearching,
        credits,
        unlockProfile,
        pushToATS,
        totalDBSize: db.length
    };
}
