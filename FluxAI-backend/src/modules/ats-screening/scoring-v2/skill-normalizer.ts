/**
 * ATS Scoring Engine V2 — Skill Normalizer
 *
 * Maps common skill aliases to canonical forms so that semantic embedding
 * comparisons start from a clean baseline. Without normalization, "ReactJS"
 * and "React.js" would produce slightly different embeddings even though
 * they're the same skill.
 *
 * Future enhancement: replace static dictionary with embedding-clustered
 * canonical forms once training data is available.
 */

// ──────────────────────────────────────────────────────────────
// Static Alias Dictionary
// ──────────────────────────────────────────────────────────────

const SKILL_ALIASES: Record<string, string> = {
    // JavaScript ecosystem
    'js':             'JavaScript',
    'javascript':     'JavaScript',
    'es6':            'JavaScript',
    'ecmascript':     'JavaScript',
    'ts':             'TypeScript',
    'typescript':     'TypeScript',

    // React
    'react':          'React',
    'reactjs':        'React',
    'react.js':       'React',
    'react js':       'React',

    // Next.js
    'next':           'Next.js',
    'nextjs':         'Next.js',
    'next.js':        'Next.js',

    // Node.js
    'node':           'Node.js',
    'nodejs':         'Node.js',
    'node.js':        'Node.js',

    // Express
    'express':        'Express.js',
    'expressjs':      'Express.js',
    'express.js':     'Express.js',

    // Vue
    'vue':            'Vue.js',
    'vuejs':          'Vue.js',
    'vue.js':         'Vue.js',

    // Angular
    'angular':        'Angular',
    'angularjs':      'Angular',
    'angular.js':     'Angular',
    'angular2':       'Angular',

    // Python
    'python':         'Python',
    'python3':        'Python',
    'py':             'Python',
    'py3':            'Python',

    // Django / Flask
    'django':         'Django',
    'flask':          'Flask',
    'fastapi':        'FastAPI',

    // Java
    'java':           'Java',
    'j2ee':           'Java EE',
    'jee':            'Java EE',

    // Spring
    'spring':         'Spring Framework',
    'springboot':     'Spring Boot',
    'spring boot':    'Spring Boot',
    'spring-boot':    'Spring Boot',

    // Go
    'go':             'Go',
    'golang':         'Go',

    // Rust
    'rust':           'Rust',
    'rustlang':       'Rust',

    // C / C++
    'c':              'C',
    'c++':            'C++',
    'cpp':            'C++',
    'cplusplus':      'C++',

    // C#
    'c#':             'C#',
    'csharp':         'C#',
    'c-sharp':        'C#',

    // .NET
    '.net':           '.NET',
    'dotnet':         '.NET',
    'asp.net':        'ASP.NET',
    'aspnet':         'ASP.NET',

    // Ruby
    'ruby':           'Ruby',
    'ror':            'Ruby on Rails',
    'rails':          'Ruby on Rails',
    'ruby on rails':  'Ruby on Rails',

    // PHP
    'php':            'PHP',
    'laravel':        'Laravel',

    // Databases
    'sql':            'SQL',
    'mysql':          'MySQL',
    'postgres':       'PostgreSQL',
    'postgresql':     'PostgreSQL',
    'pg':             'PostgreSQL',
    'mongo':          'MongoDB',
    'mongodb':        'MongoDB',
    'redis':          'Redis',
    'dynamodb':       'DynamoDB',
    'dynamo':         'DynamoDB',
    'cassandra':      'Cassandra',
    'sqlite':         'SQLite',

    // Cloud / DevOps
    'aws':            'AWS',
    'amazon web services': 'AWS',
    'gcp':            'Google Cloud Platform',
    'google cloud':   'Google Cloud Platform',
    'azure':          'Microsoft Azure',
    'docker':         'Docker',
    'k8s':            'Kubernetes',
    'kubernetes':     'Kubernetes',
    'terraform':      'Terraform',
    'ansible':        'Ansible',
    'jenkins':        'Jenkins',
    'ci/cd':          'CI/CD',
    'cicd':           'CI/CD',

    // Frontend / CSS
    'css':            'CSS',
    'css3':           'CSS',
    'html':           'HTML',
    'html5':          'HTML',
    'sass':           'Sass',
    'scss':           'Sass',
    'less':           'Less',
    'tailwind':       'Tailwind CSS',
    'tailwindcss':    'Tailwind CSS',
    'bootstrap':      'Bootstrap',

    // Mobile
    'react native':   'React Native',
    'reactnative':    'React Native',
    'rn':             'React Native',
    'flutter':        'Flutter',
    'swift':          'Swift',
    'kotlin':         'Kotlin',
    'ios':            'iOS Development',
    'android':        'Android Development',

    // Data / ML
    'ml':             'Machine Learning',
    'machine learning': 'Machine Learning',
    'dl':             'Deep Learning',
    'deep learning':  'Deep Learning',
    'ai':             'Artificial Intelligence',
    'artificial intelligence': 'Artificial Intelligence',
    'nlp':            'Natural Language Processing',
    'cv':             'Computer Vision',
    'tensorflow':     'TensorFlow',
    'tf':             'TensorFlow',
    'pytorch':        'PyTorch',
    'numpy':          'NumPy',
    'pandas':         'pandas',
    'scikit-learn':   'scikit-learn',
    'sklearn':        'scikit-learn',

    // Tools / Misc
    'git':            'Git',
    'github':         'GitHub',
    'gitlab':         'GitLab',
    'bitbucket':      'Bitbucket',
    'jira':           'Jira',
    'linux':          'Linux',
    'bash':           'Bash',
    'graphql':        'GraphQL',
    'rest':           'REST API',
    'restful':        'REST API',
    'rest api':       'REST API',
    'grpc':           'gRPC',
    'websocket':      'WebSocket',
    'websockets':     'WebSocket',
    'rabbitmq':       'RabbitMQ',
    'kafka':          'Apache Kafka',
    'elasticsearch':  'Elasticsearch',
    'es':             'Elasticsearch',
    'webpack':        'Webpack',
    'vite':           'Vite',
    'figma':          'Figma',
};

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Normalize a single skill string to its canonical form.
 * If no alias is found, returns the original string with basic trimming.
 */
export function normalizeSkill(raw: string): string {
    if (!raw || typeof raw !== 'string') return raw;

    const key = raw.trim().toLowerCase();
    return SKILL_ALIASES[key] ?? raw.trim();
}

/**
 * Normalize an array of skill strings, deduplicating the result.
 */
export function normalizeSkills(skills: string[]): string[] {
    if (!skills || skills.length === 0) return [];

    const seen = new Set<string>();
    const result: string[] = [];

    for (const skill of skills) {
        const normalized = normalizeSkill(skill);
        const key = normalized.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            result.push(normalized);
        }
    }

    return result;
}
