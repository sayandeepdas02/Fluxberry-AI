/**
 * Skill Suggestions Service
 *
 * Phase 1: Static dictionary (~200 common skills) with prefix-match search.
 * Phase 2: Augment with frequency-based suggestions from DB.
 *
 * Grouped by role so role-hint can prioritize relevant skills at the top.
 */

// ──────────────────────────────────────────────────────────────
// Skill Dictionary
// ──────────────────────────────────────────────────────────────

const SKILL_GROUPS: Record<string, string[]> = {
    Frontend: [
        'React', 'Vue.js', 'Angular', 'Next.js', 'Svelte', 'TypeScript', 'JavaScript',
        'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Webpack', 'Vite', 'Redux', 'Zustand',
        'React Query', 'GraphQL', 'REST APIs', 'Figma', 'Storybook', 'Cypress', 'Jest',
        'Accessibility (a11y)', 'Web Performance', 'Responsive Design',
    ],
    Backend: [
        'Node.js', 'Python', 'Java', 'Go', 'Rust', 'C#', 'PHP', 'Ruby',
        'Express.js', 'FastAPI', 'Django', 'Rails', 'Spring Boot', 'NestJS',
        'REST APIs', 'GraphQL', 'gRPC', 'PostgreSQL', 'MySQL', 'MongoDB',
        'Redis', 'Elasticsearch', 'RabbitMQ', 'Kafka', 'Microservices',
    ],
    DevOps: [
        'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'AWS', 'GCP', 'Azure',
        'CI/CD', 'GitHub Actions', 'Jenkins', 'Prometheus', 'Grafana', 'Datadog',
        'Nginx', 'Linux', 'Bash', 'Helm', 'ArgoCD', 'Infrastructure as Code',
    ],
    'Data Science': [
        'Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow',
        'PyTorch', 'Jupyter', 'Spark', 'Hadoop', 'Tableau', 'Power BI',
        'Statistics', 'Machine Learning', 'Data Visualization', 'Feature Engineering',
        'A/B Testing', 'Experiment Design',
    ],
    'Machine Learning': [
        'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Hugging Face', 'LLMs',
        'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Vertex AI', 'SageMaker',
        'CUDA', 'Python', 'MLflow', 'Ray', 'Reinforcement Learning',
    ],
    Design: [
        'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Photoshop', 'Illustrator',
        'Prototyping', 'Wireframing', 'User Research', 'Usability Testing',
        'Design Systems', 'Accessibility', 'Motion Design', 'UI Design', 'UX Design',
    ],
    Management: [
        'Agile', 'Scrum', 'Kanban', 'OKRs', 'Roadmapping', 'Stakeholder Management',
        'Technical Leadership', 'Team Building', 'Mentoring', 'Budget Planning',
        'Product Strategy', 'Cross-functional Collaboration', 'Risk Management',
    ],
    General: [
        'Git', 'GitHub', 'Jira', 'Confluence', 'Slack', 'Notion', 'Communication',
        'Problem Solving', 'System Design', 'Code Review', 'Documentation',
        'Unit Testing', 'TDD', 'Agile', 'Remote Collaboration',
    ],
}

// Flat deduplicated list for general search
const ALL_SKILLS: string[] = [...new Set(Object.values(SKILL_GROUPS).flat())]

// ──────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────

class SkillSuggestionsService {
    /**
     * Returns up to `limit` skill suggestions matching the prefix query.
     * If a roleHint is provided, role-specific skills are ranked first.
     */
    suggestSkills(query: string, roleHint?: string, limit = 8): string[] {
        const q = query.trim().toLowerCase()
        if (!q || q.length < 1) {
            // Return popular/role-specific skills on empty query
            const roleSkills = roleHint ? (SKILL_GROUPS[roleHint] ?? []) : []
            return [...roleSkills, ...SKILL_GROUPS.General].slice(0, limit)
        }

        const rolePriority = roleHint ? (SKILL_GROUPS[roleHint] ?? []) : []

        const matches = (skill: string) =>
            skill.toLowerCase().includes(q) || skill.toLowerCase().startsWith(q)

        // Role-specific first, then general
        const prioritized = [
            ...rolePriority.filter(matches),
            ...ALL_SKILLS.filter(s => !rolePriority.includes(s) && matches(s)),
        ]

        return [...new Set(prioritized)].slice(0, limit)
    }

    /** Get skills for a specific role (shown on empty chip input focus) */
    getSkillsForRole(role: string): string[] {
        return SKILL_GROUPS[role] ?? SKILL_GROUPS.General
    }

    /** All available role types */
    getRoleTypes(): string[] {
        return Object.keys(SKILL_GROUPS).filter(k => k !== 'General')
    }
}

export const skillSuggestionsService = new SkillSuggestionsService()
