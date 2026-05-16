import {
    Home,
    Zap,
    Settings2,
    Briefcase,
    PlusCircle,
    GitBranch,
    ClipboardList,
    FileBarChart,
    HelpCircle,
    HandCoins,
    ArrowRightCircle,
    BarChart3,
    Plug,
    Settings,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon?: LucideIcon;
    badge?: string;
}

export interface NavSection {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: string;
    items: NavItem[];
}

// ── Top-level items ──────────────────────────────────────────────────────────
export const mainNavItems: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: Home },
];

// ── Collapsible product sections ─────────────────────────────────────────────
export const productSections: NavSection[] = [
    {
        id: "berry-ai",
        label: "Berry AI",
        icon: Zap,
        badge: "AI",
        items: [
            { label: "New Automation", href: "/dashboard/berry-ai", icon: Zap },
            { label: "Manage Automations", href: "/dashboard/berry-ai/automations", icon: Settings2 },
        ],
    },
    {
        id: "job-board",
        label: "Job Board & ATS",
        icon: Briefcase,
        items: [
            { label: "Create Job", href: "/dashboard/jobs/create", icon: PlusCircle },
            { label: "Manage Jobs", href: "/dashboard/jobs/manage", icon: Briefcase },
            { label: "Pipeline", href: "/dashboard/pipeline", icon: GitBranch },
        ],
    },
    {
        id: "assessments",
        label: "Assessments",
        icon: ClipboardList,
        items: [
            { label: "Create Assessment", href: "/dashboard/assessments/create", icon: PlusCircle },
            { label: "Reports", href: "/dashboard/assessments/reports", icon: FileBarChart },
            { label: "Question Banks", href: "/dashboard/assessments/question-banks", icon: HelpCircle },
        ],
    },
    {
        id: "onboarding",
        label: "Onboarding",
        icon: HandCoins,
        items: [
            { label: "Send Offer", href: "/dashboard/onboarding/send-offer", icon: HandCoins },
            { label: "Manage Pipeline", href: "/dashboard/onboarding/pipeline", icon: ArrowRightCircle },
        ],
    },
    {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
        items: [
            { label: "Hiring Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        ],
    },
    {
        id: "integrations",
        label: "Integrations",
        icon: Plug,
        items: [
            { label: "Connect", href: "/dashboard/integrations", icon: Plug },
        ],
    },
];

// ── Bottom items ─────────────────────────────────────────────────────────────
export const bottomNavItems: NavItem[] = [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
export function isRouteActive(pathname: string, href: string): boolean {
    if (href === "/dashboard") {
        return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
}

export function isSectionActive(pathname: string, section: NavSection): boolean {
    return section.items.some((item) => isRouteActive(pathname, item.href));
}

export function findSectionForRoute(pathname: string): string | null {
    for (const section of productSections) {
        for (const item of section.items) {
            if (isRouteActive(pathname, item.href)) {
                return section.id;
            }
        }
    }
    return null;
}
