export type PricingTier = 'free' | 'growth' | 'scale' | 'enterprise';

export type AppCategory = 'core' | 'add_on';

export interface PlatformApp {
    id: string;
    name: string;
    description: string;
    category: AppCategory;
    pricingType: 'included' | 'credits' | 'usage';
    iconName: string; // Used to dynamically render the lucide icon
    routeId: string; // Base URL path (e.g., 'talent-prospect')
}

export interface AppRegistryState {
    [appId: string]: {
        enabled: boolean;
        installed: boolean;
        limits?: {
            credits?: number;
            resumes?: number;
            interviews?: number;
        }
    }
}

export interface SubscriptionConfig {
    plan: PricingTier;
    trialActive: boolean;
    trialEndsAt: string | null;
    apps: AppRegistryState;
}

// Complete catalog of available Fluxberry OS modules
export const PLATFORM_APPS: PlatformApp[] = [
    {
        id: 'job_board',
        name: 'Job Board',
        description: 'Publish and manage career listings globally.',
        category: 'core',
        pricingType: 'included',
        iconName: 'Briefcase',
        routeId: 'manage-jobs'
    },
    {
        id: 'ats_screening',
        name: 'ATS Screening',
        description: 'Track applicants through the hiring pipeline.',
        category: 'core',
        pricingType: 'included',
        iconName: 'Activity',
        routeId: 'ats-screening'
    },
    {
        id: 'onboarding',
        name: 'Talent Onboarding',
        description: 'Manage offers and candidate induction workflows.',
        category: 'core',
        pricingType: 'included',
        iconName: 'FileText',
        routeId: 'onboarding'
    },
    {
        id: 'interview_agent',
        name: 'Interview Automation',
        description: 'Usage-based AI voice interviewing system.',
        category: 'add_on',
        pricingType: 'usage',
        iconName: 'ShoppingBag',
        routeId: 'interviews'
    },
    {
        id: 'talent_prospect',
        name: 'Talent Prospect',
        description: 'AI-native global candidate sourcing engine.',
        category: 'add_on',
        pricingType: 'credits',
        iconName: 'Search',
        routeId: 'talent-prospect'
    },
    {
        id: 'analytics',
        name: 'Advanced Analytics',
        description: 'Deep reporting on hiring velocity and diversity.',
        category: 'add_on',
        pricingType: 'included', // Included in Growth+
        iconName: 'BarChart',
        routeId: 'analytics'
    }
];
