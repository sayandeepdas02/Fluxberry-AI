import {
  Home,
  Inbox,
  Users,
  BarChart3,
  Gift,
  Briefcase,
  PlusCircle,
  TrendingUp,
  Share2,
  GitBranch,
  UserCheck,
  Zap,
  ClipboardList,
  Search,
  List,
  Send,
  FileText,
  LineChart,
  Brain,
  Video,
  Mic,
  HelpCircle,
  FileBarChart,
  HandCoins,
  PenTool,
  UserPlus,
  ArrowRightCircle,
  LayoutGrid,
  Globe,
  Settings,
  Database,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   NAVIGATION CONFIG — Single source of truth
   All sidebar items are defined here as data.
   ═══════════════════════════════════════════════════ */

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

export interface NavGroup {
  title?: string;
  items?: NavItem[];
  sections?: NavSection[];
}

// ── Main navigation items (top of sidebar) ──
export const mainNavItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
  { label: "Candidates", href: "/dashboard/candidates", icon: Users },
  { label: "Talent CRM", href: "/dashboard/crm", icon: Database },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Referrals", href: "/dashboard/referrals", icon: Gift },
];

// ── Product sections (collapsible menus) ──
export const productSections: NavSection[] = [
  {
    id: "job-board",
    label: "Job Board",
    icon: Briefcase,
    items: [
      { label: "Manage Jobs", href: "/dashboard/jobs/manage", icon: Briefcase },
      { label: "Create Job", href: "/dashboard/jobs/create", icon: PlusCircle },
      { label: "Job Insights", href: "/dashboard/jobs/insights", icon: TrendingUp },
      { label: "Distribution", href: "/dashboard/jobs/distribution", icon: Share2 },
    ],
  },
  {
    id: "ats",
    label: "ATS",
    icon: GitBranch,
    items: [
      { label: "Pipeline", href: "/dashboard/ats/pipeline", icon: GitBranch },
      { label: "All Candidates", href: "/dashboard/ats/candidates", icon: UserCheck },
      { label: "Automations", href: "/dashboard/ats/automations", icon: Zap },
      { label: "Scorecards", href: "/dashboard/ats/scorecards", icon: ClipboardList },
    ],
  },
  {
    id: "talent-prospect",
    label: "Talent Prospect",
    icon: Search,
    badge: "AI",
    items: [
      { label: "Search", href: "/dashboard/talent-prospect/search", icon: Search },
      { label: "Lists", href: "/dashboard/talent-prospect/lists", icon: List },
      { label: "Campaigns", href: "/dashboard/talent-prospect/campaigns", icon: Send },
      { label: "Templates", href: "/dashboard/talent-prospect/templates", icon: FileText },
      { label: "Analytics", href: "/dashboard/talent-prospect/analytics", icon: LineChart },
    ],
  },
  {
    id: "interviews",
    label: "Interview Automation",
    icon: Brain,
    badge: "AI",
    items: [
      { label: "Assessments", href: "/dashboard/interviews/assessments", icon: ClipboardList },
      { label: "AI Interviews", href: "/dashboard/interviews/ai", icon: Brain },
      { label: "Live Interviews", href: "/dashboard/interviews/live", icon: Video },
      { label: "Question Bank", href: "/dashboard/interviews/question-bank", icon: HelpCircle },
      { label: "Reports", href: "/dashboard/interviews/reports", icon: FileBarChart },
    ],
  },
  {
    id: "onboarding",
    label: "Talent Onboarding",
    icon: UserPlus,
    items: [
      { label: "Offers", href: "/dashboard/onboarding/offers", icon: HandCoins },
      { label: "E-Signatures", href: "/dashboard/onboarding/e-signatures", icon: PenTool },
      { label: "Pre-Onboarding", href: "/dashboard/onboarding/pre-onboarding", icon: FileText },
      { label: "Joining Pipeline", href: "/dashboard/onboarding/joining-pipeline", icon: ArrowRightCircle },
    ],
  },
];

// ── Bottom navigation items ──
export const bottomNavItems: NavItem[] = [
  { label: "OS Marketplace", href: "/dashboard/marketplace", icon: LayoutGrid },
  { label: "Public Career Page", href: "/dashboard/career-page", icon: Globe },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// ── Helper: find which product section a route belongs to ──
export function findSectionForRoute(pathname: string): string | null {
  for (const section of productSections) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return section.id;
      }
    }
  }
  return null;
}

// ── Helper: check if a route is active (exact or prefix match) ──
export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
}

// ── Helper: check if a section has any active child ──
export function isSectionActive(pathname: string, section: NavSection): boolean {
  return section.items.some((item) => isRouteActive(pathname, item.href));
}
