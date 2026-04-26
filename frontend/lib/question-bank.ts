export type Difficulty = "Easy" | "Medium" | "Hard";

export interface BankQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    difficulty: Difficulty;
    category: string;
}

export const CURATED_QUESTION_BANK: BankQuestion[] = [
    // ─── EASY (1–10) ───────────────────────────────────────────────────────────
    {
        id: "q1",
        text: "What is the output of typeof null in JavaScript?",
        options: ['"null"', '"object"', '"undefined"', '"number"'],
        correctAnswer: '"object"',
        difficulty: "Easy",
        category: "JavaScript"
    },
    {
        id: "q2",
        text: "Which method converts a JSON string to an object in JavaScript?",
        options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.convert()"],
        correctAnswer: "JSON.parse()",
        difficulty: "Easy",
        category: "JavaScript"
    },
    {
        id: "q3",
        text: "Which Python data type is immutable?",
        options: ["List", "Dictionary", "Tuple", "Set"],
        correctAnswer: "Tuple",
        difficulty: "Easy",
        category: "Python"
    },
    {
        id: "q4",
        text: "What does npm init do?",
        options: ["Installs dependencies", "Creates package.json", "Runs Node server", "Compiles JS code"],
        correctAnswer: "Creates package.json",
        difficulty: "Easy",
        category: "Node.js"
    },
    {
        id: "q5",
        text: "Which HTTP method is used to update a resource?",
        options: ["GET", "POST", "PUT", "OPTIONS"],
        correctAnswer: "PUT",
        difficulty: "Easy",
        category: "HTTP"
    },
    {
        id: "q6",
        text: "In Express.js, what is req.params used for?",
        options: ["Query params", "Body data", "URL parameters", "Headers"],
        correctAnswer: "URL parameters",
        difficulty: "Easy",
        category: "Express.js"
    },
    {
        id: "q7",
        text: "What is the default port for HTTP?",
        options: ["3000", "8080", "80", "443"],
        correctAnswer: "80",
        difficulty: "Easy",
        category: "HTTP"
    },
    {
        id: "q8",
        text: "Which keyword is used to handle async operations in JS?",
        options: ["wait", "async/await", "defer", "promiseOnly"],
        correctAnswer: "async/await",
        difficulty: "Easy",
        category: "JavaScript"
    },
    {
        id: "q9",
        text: "In Python, which keyword defines a function?",
        options: ["func", "function", "def", "lambda"],
        correctAnswer: "def",
        difficulty: "Easy",
        category: "Python"
    },
    {
        id: "q10",
        text: "What is JWT mainly used for?",
        options: ["Styling UI", "Database indexing", "Authentication", "Routing"],
        correctAnswer: "Authentication",
        difficulty: "Easy",
        category: "Security"
    },
    // ─── MEDIUM (11–30) ────────────────────────────────────────────────────────
    {
        id: "q11",
        text: "What will [] + [] return in JS?",
        options: ["[]", '""', "undefined", "null"],
        correctAnswer: '""',
        difficulty: "Medium",
        category: "JavaScript"
    },
    {
        id: "q12",
        text: "What is closure in JavaScript?",
        options: ["Function inside loop", "Function with preserved lexical scope", "Object method", "Promise chain"],
        correctAnswer: "Function with preserved lexical scope",
        difficulty: "Medium",
        category: "JavaScript"
    },
    {
        id: "q13",
        text: 'Which HTTP status code means "Unauthorized"?',
        options: ["401", "403", "404", "500"],
        correctAnswer: "401",
        difficulty: "Medium",
        category: "HTTP"
    },
    {
        id: "q14",
        text: "What does middleware do in Express?",
        options: ["Handles DB queries", "Modifies request/response", "Compiles JS", "Routes static files"],
        correctAnswer: "Modifies request/response",
        difficulty: "Medium",
        category: "Express.js"
    },
    {
        id: "q15",
        text: "In Node.js, what is the event loop responsible for?",
        options: ["Memory management", "Handling async callbacks", "Compiling JS", "Managing threads"],
        correctAnswer: "Handling async callbacks",
        difficulty: "Medium",
        category: "Node.js"
    },
    {
        id: "q16",
        text: "What is the difference between == and ===?",
        options: ["No difference", "Type coercion vs strict comparison", "Memory allocation", "Speed difference only"],
        correctAnswer: "Type coercion vs strict comparison",
        difficulty: "Medium",
        category: "JavaScript"
    },
    {
        id: "q17",
        text: "In Python, what does *args represent?",
        options: ["Keyword args", "Variable positional arguments", "Default args", "Static args"],
        correctAnswer: "Variable positional arguments",
        difficulty: "Medium",
        category: "Python"
    },
    {
        id: "q18",
        text: "What is REST?",
        options: ["Database system", "Architectural style for APIs", "Programming language", "Authentication method"],
        correctAnswer: "Architectural style for APIs",
        difficulty: "Medium",
        category: "Backend"
    },
    {
        id: "q19",
        text: "What is process.env used for?",
        options: ["Access OS environment variables", "Manage threads", "Handle routing", "Logging"],
        correctAnswer: "Access OS environment variables",
        difficulty: "Medium",
        category: "Node.js"
    },
    {
        id: "q20",
        text: "What does res.status(200).json() do?",
        options: ["Redirects", "Sends JSON response", "Logs response", "Ends server"],
        correctAnswer: "Sends JSON response",
        difficulty: "Medium",
        category: "Express.js"
    },
    {
        id: "q21",
        text: "What is CORS?",
        options: ["Security mechanism", "Database query", "Routing method", "Logging tool"],
        correctAnswer: "Security mechanism",
        difficulty: "Medium",
        category: "Security"
    },
    {
        id: "q22",
        text: "Which DB is NoSQL?",
        options: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"],
        correctAnswer: "MongoDB",
        difficulty: "Medium",
        category: "Database"
    },
    {
        id: "q23",
        text: "What is indexing in DB?",
        options: ["Data duplication", "Faster lookup mechanism", "Backup process", "Logging system"],
        correctAnswer: "Faster lookup mechanism",
        difficulty: "Medium",
        category: "Database"
    },
    {
        id: "q24",
        text: "What is hashing used for in auth?",
        options: ["Encryption", "Password storage", "Routing", "Logging"],
        correctAnswer: "Password storage",
        difficulty: "Medium",
        category: "Security"
    },
    {
        id: "q25",
        text: "Which authentication type is stateless?",
        options: ["Session auth", "JWT auth", "Cookies", "Cache"],
        correctAnswer: "JWT auth",
        difficulty: "Medium",
        category: "Security"
    },
    {
        id: "q26",
        text: "What does next() do in Express?",
        options: ["Ends response", "Calls next middleware", "Logs request", "Sends error"],
        correctAnswer: "Calls next middleware",
        difficulty: "Medium",
        category: "Express.js"
    },
    {
        id: "q27",
        text: "What is SSR in Next.js?",
        options: ["Static rendering", "Server-side rendering", "Styling system", "Routing mechanism"],
        correctAnswer: "Server-side rendering",
        difficulty: "Medium",
        category: "Next.js"
    },
    {
        id: "q28",
        text: "What is useEffect used for?",
        options: ["Routing", "Side effects", "State storage", "Styling"],
        correctAnswer: "Side effects",
        difficulty: "Medium",
        category: "React"
    },
    {
        id: "q29",
        text: "What is rate limiting?",
        options: ["DB indexing", "Restricting API usage", "Routing", "Caching"],
        correctAnswer: "Restricting API usage",
        difficulty: "Medium",
        category: "Backend"
    },
    {
        id: "q30",
        text: "What does bcrypt do?",
        options: ["Encrypt data", "Hash passwords", "Manage tokens", "Compress data"],
        correctAnswer: "Hash passwords",
        difficulty: "Medium",
        category: "Security"
    },
    // ─── HARD (31–50) ──────────────────────────────────────────────────────────
    {
        id: "q31",
        text: "What is the output of: console.log(0.1 + 0.2 === 0.3)?",
        options: ["true", "false", "undefined", "error"],
        correctAnswer: "false",
        difficulty: "Hard",
        category: "JavaScript"
    },
    {
        id: "q32",
        text: "What is a race condition?",
        options: ["Fast DB query", "Concurrent execution issue", "API error", "Routing bug"],
        correctAnswer: "Concurrent execution issue",
        difficulty: "Hard",
        category: "Systems"
    },
    {
        id: "q33",
        text: "What is CAP theorem?",
        options: ["Cache API Protocol", "Consistency, Availability, Partition tolerance", "Compute Allocation Protocol", "None of the above"],
        correctAnswer: "Consistency, Availability, Partition tolerance",
        difficulty: "Hard",
        category: "Database"
    },
    {
        id: "q34",
        text: "What is the purpose of the cluster module in Node.js?",
        options: ["DB management", "Multi-core scaling", "Routing", "Logging"],
        correctAnswer: "Multi-core scaling",
        difficulty: "Hard",
        category: "Node.js"
    },
    {
        id: "q35",
        text: "What is the N+1 query problem?",
        options: ["Too many DB connections", "Inefficient repeated queries", "Cache issue", "API timeout"],
        correctAnswer: "Inefficient repeated queries",
        difficulty: "Hard",
        category: "Database"
    },
    {
        id: "q36",
        text: "What is idempotency?",
        options: ["Same request → same result", "Fast API", "DB locking", "Stateless system"],
        correctAnswer: "Same request → same result",
        difficulty: "Hard",
        category: "Backend"
    },
    {
        id: "q37",
        text: "What is CSRF?",
        options: ["Auth bypass attack", "SQL injection", "XSS variant", "Cache issue"],
        correctAnswer: "Auth bypass attack",
        difficulty: "Hard",
        category: "Security"
    },
    {
        id: "q38",
        text: "What is XSS?",
        options: ["DB attack", "Script injection", "Auth failure", "Routing issue"],
        correctAnswer: "Script injection",
        difficulty: "Hard",
        category: "Security"
    },
    {
        id: "q39",
        text: "What is eventual consistency?",
        options: ["Immediate consistency", "Delayed consistency", "No consistency", "Strong consistency"],
        correctAnswer: "Delayed consistency",
        difficulty: "Hard",
        category: "Database"
    },
    {
        id: "q40",
        text: "What does await do internally?",
        options: ["Blocks thread", "Uses event loop & promises", "Creates thread", "Stops execution permanently"],
        correctAnswer: "Uses event loop & promises",
        difficulty: "Hard",
        category: "JavaScript"
    },
    {
        id: "q41",
        text: "What is a cold start in serverless?",
        options: ["Cache miss", "Initial function latency", "DB failure", "Routing delay"],
        correctAnswer: "Initial function latency",
        difficulty: "Hard",
        category: "Backend"
    },
    {
        id: "q42",
        text: "What is connection pooling?",
        options: ["DB backup", "Reusing DB connections", "Cache system", "API routing"],
        correctAnswer: "Reusing DB connections",
        difficulty: "Hard",
        category: "Database"
    },
    {
        id: "q43",
        text: "What is a monolith?",
        options: ["Distributed system", "Single codebase app", "Microservice", "API gateway"],
        correctAnswer: "Single codebase app",
        difficulty: "Hard",
        category: "Architecture"
    },
    {
        id: "q44",
        text: "What is microservices architecture?",
        options: ["Single app", "Independent services", "DB system", "Frontend pattern"],
        correctAnswer: "Independent services",
        difficulty: "Hard",
        category: "Architecture"
    },
    {
        id: "q45",
        text: "What is GraphQL?",
        options: ["DB", "Query language for APIs", "Cache", "Auth system"],
        correctAnswer: "Query language for APIs",
        difficulty: "Hard",
        category: "Backend"
    },
    {
        id: "q46",
        text: "What is load balancing?",
        options: ["DB indexing", "Distributing traffic", "Routing", "Logging"],
        correctAnswer: "Distributing traffic",
        difficulty: "Hard",
        category: "Systems"
    },
    {
        id: "q47",
        text: "What is a reverse proxy?",
        options: ["Client proxy", "Server-side proxy", "DB proxy", "Cache proxy"],
        correctAnswer: "Server-side proxy",
        difficulty: "Hard",
        category: "Systems"
    },
    {
        id: "q48",
        text: "What is OAuth?",
        options: ["Encryption", "Authorization protocol", "Database", "Routing system"],
        correctAnswer: "Authorization protocol",
        difficulty: "Hard",
        category: "Security"
    },
    {
        id: "q49",
        text: "What is the purpose of Redis?",
        options: ["Persistent DB", "In-memory cache", "Compiler", "Routing engine"],
        correctAnswer: "In-memory cache",
        difficulty: "Hard",
        category: "Database"
    },
    {
        id: "q50",
        text: "What is the difference between throttling and debouncing?",
        options: ["Same thing", "Rate control techniques", "DB optimization", "Routing logic"],
        correctAnswer: "Rate control techniques",
        difficulty: "Hard",
        category: "JavaScript"
    },
];

// Legacy format used by auto-generate — kept for backward compat
export const QUESTION_TEMPLATES: Record<string, any[]> = {
    "Frontend": CURATED_QUESTION_BANK
        .filter(q => ["JavaScript", "React", "Next.js"].includes(q.category))
        .map(q => ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer })),
    "Backend": CURATED_QUESTION_BANK
        .filter(q => ["Backend", "Express.js", "Node.js", "HTTP"].includes(q.category))
        .map(q => ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer })),
    "Full Stack": CURATED_QUESTION_BANK
        .map(q => ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer })),
    "Data Structures & Algorithms": [
        { text: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: "O(log n)" },
        { text: "Which data structure uses FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], correctAnswer: "Queue" },
        { text: "Which traversal gives sorted output in BST?", options: ["Preorder", "Postorder", "Inorder", "Level order"], correctAnswer: "Inorder" },
        { text: "Time complexity of quicksort (average)?", options: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"], correctAnswer: "O(n log n)" },
        { text: "Which DS is used for recursion?", options: ["Queue", "Stack", "Heap", "Tree"], correctAnswer: "Stack" },
    ],
};
