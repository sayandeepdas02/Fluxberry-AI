export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard'
export type QuestionType = 'Single' | 'Multi'

export interface MCQQuestion {
    id: string
    text: string
    options: string[]
    correctOptions: number[] // Indices
    type: QuestionType
    category: string
    difficulty: QuestionDifficulty
}

export interface DSAQuestion {
    id: string
    title: string
    description: string // HTML support
    difficulty: QuestionDifficulty
    topics: string[]
    supportedLanguages: string[]
    starterCode: Record<string, string>
}

export const mcqBank: MCQQuestion[] = [
    // DBMS
    {
        id: 'dbms-1',
        text: 'Which normal form eliminates partial dependency?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correctOptions: [1],
        type: 'Single',
        category: 'DBMS',
        difficulty: 'Medium'
    },
    {
        id: 'dbms-2',
        text: 'Which of the following are ACID properties?',
        options: ['Atomicity', 'Consistency', 'Integrity', 'Durability'],
        correctOptions: [0, 1, 3],
        type: 'Multi',
        category: 'DBMS',
        difficulty: 'Easy'
    },
    {
        id: 'dbms-3',
        text: 'What is the default isolation level in MySQL InnoDB?',
        options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
        correctOptions: [2],
        type: 'Single',
        category: 'DBMS',
        difficulty: 'Hard'
    },
    {
        id: 'dbms-4',
        text: 'Select valid SQL constraints.',
        options: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'INDEX'],
        correctOptions: [0, 1, 2],
        type: 'Multi',
        category: 'DBMS',
        difficulty: 'Easy'
    },
    // OOPS
    {
        id: 'oops-1',
        text: 'Which principle states that objects should be replaceable with instances of their subtypes?',
        options: ['Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
        correctOptions: [1],
        type: 'Single',
        category: 'OOPS',
        difficulty: 'Medium'
    },
    {
        id: 'oops-2',
        text: 'Which of the following support Polymorphism?',
        options: ['Method Overloading', 'Method Overriding', 'Encapsulation', 'Operator Overloading'],
        correctOptions: [0, 1, 3],
        type: 'Multi',
        category: 'OOPS',
        difficulty: 'Medium'
    },
    // OS
    {
        id: 'os-1',
        text: 'Which scheduling algorithm can cause starvation?',
        options: ['Round Robin', 'FCFS', 'SJF', 'Multilevel Queue'],
        correctOptions: [2],
        type: 'Single',
        category: 'Operating Systems',
        difficulty: 'Medium'
    },
    {
        id: 'os-2',
        text: 'What constitutes a Process Control Block (PCB)?',
        options: ['Process ID', 'Program Counter', 'CPU Registers', 'Heap Memory'],
        correctOptions: [0, 1, 2],
        type: 'Multi',
        category: 'Operating Systems',
        difficulty: 'Hard'
    },
    // React / Frontend
    {
        id: 'fe-1',
        text: 'What is the primary purpose of useEffect?',
        options: ['State management', 'Side effects', 'Routing', 'Memoization'],
        correctOptions: [1],
        type: 'Single',
        category: 'Frontend',
        difficulty: 'Easy'
    },
    {
        id: 'fe-2',
        text: 'Which of the following trigger a re-render in React?',
        options: ['State change', 'Prop change', 'Ref change', 'Parent re-render'],
        correctOptions: [0, 1, 3],
        type: 'Multi',
        category: 'Frontend',
        difficulty: 'Medium'
    },
    // ... Filling up to mimic a larger bank
    ...Array.from({ length: 20 }).map((_, i) => ({
        id: `gen-single-${i}`,
        text: `Sample Single Choice Question ${i + 1} regarding system architecture.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOptions: [0],
        type: 'Single' as const,
        category: i % 2 === 0 ? 'Architecture' : 'DevOps',
        difficulty: (i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard') as QuestionDifficulty
    })),
    ...Array.from({ length: 10 }).map((_, i) => ({
        id: `gen-multi-${i}`,
        text: `Sample Multiple Choice Question ${i + 1} regarding cloud patterns.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOptions: [0, 2],
        type: 'Multi' as const,
        category: 'Cloud',
        difficulty: 'Medium' as QuestionDifficulty
    }))
]

export const dsaBank: DSAQuestion[] = [
    {
        id: 'dsa-1',
        title: 'Two Sum',
        description: 'Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.',
        difficulty: 'Easy',
        topics: ['Array', 'Hash Table'],
        supportedLanguages: ['JavaScript', 'Python', 'Java', 'C++'],
        starterCode: {
            javascript: 'function twoSum(nums, target) {\n\n}'
        }
    },
    {
        id: 'dsa-2',
        title: 'LRU Cache',
        description: 'Design a data structure that follows the constraints of a <strong>Least Recently Used (LRU) cache</strong>.',
        difficulty: 'Medium',
        topics: ['Design', 'Hash Table', 'Linked List'],
        supportedLanguages: ['JavaScript', 'Python', 'Java', 'C++'],
        starterCode: {
            javascript: 'class LRUCache {\n    constructor(capacity) {\n\n    }\n}'
        }
    },
    {
        id: 'dsa-3',
        title: 'Merge K Sorted Lists',
        description: 'You are given an array of <code>k</code> linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
        difficulty: 'Hard',
        topics: ['Linked List', 'Divide and Conquer', 'Heap'],
        supportedLanguages: ['JavaScript', 'Python', 'Java', 'C++'],
        starterCode: {
            javascript: '/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode[]} lists\n * @return {ListNode}\n */\nvar mergeKLists = function(lists) {\n\n};'
        }
    },
    {
        id: 'dsa-4',
        title: 'Valid Parentheses',
        description: 'Given a string components containing just the characters <code>(</code>, <code>)</code>, <code>{</code>, <code>}</code>, <code>[</code> and <code>]</code>, determine if the input string is valid.',
        difficulty: 'Easy',
        topics: ['String', 'Stack'],
        supportedLanguages: ['JavaScript', 'Python', 'Java'],
        starterCode: {
            javascript: 'var isValid = function(s) {\n\n};'
        }
    },
    {
        id: 'dsa-5',
        title: 'Longest Substring Without Repeating Characters',
        description: 'Given a string <code>s</code>, find the length of the longest substring without repeating characters.',
        difficulty: 'Medium',
        topics: ['String', 'Sliding Window', 'Hash Table'],
        supportedLanguages: ['JavaScript', 'Python', 'Java'],
        starterCode: {
            javascript: 'var lengthOfLongestSubstring = function(s) {\n\n};'
        }
    },
    {
        id: 'dsa-6',
        title: 'Trapping Rain Water',
        description: 'Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        difficulty: 'Hard',
        topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
        supportedLanguages: ['JavaScript', 'Python', 'Java'],
        starterCode: {
            javascript: 'var trap = function(height) {\n\n};'
        }
    }
]

export const aiAgents = [
    {
        id: 'frontend',
        role: 'Senior Frontend Engineer',
        focus: ['React Internals', 'Web Performance', 'System Design'],
        description: 'This agent focuses on deep frontend concepts, browser internals, and modern JS frameworks.',
        sampleQuestion: 'How does the browser rendering engine handle CSSOM construction blocking the DOM tree?',
        color: 'bg-blue-100 text-blue-700'
    },
    {
        id: 'backend',
        role: 'Senior Backend Engineer',
        focus: ['Distributed Systems', 'Database Scaling', 'API Design'],
        description: 'Evaluates candidates on scalability, database design patterns, and microservices architecture.',
        sampleQuestion: 'Explain the trade-offs between eventual consistency and strong consistency in a distributed system.',
        color: 'bg-green-100 text-green-700'
    },
    {
        id: 'devops',
        role: 'Cloud & DevOps Engineer',
        focus: ['CI/CD Pipelines', 'Kubernetes', 'Infrastructure as Code'],
        description: 'Focuses on operational excellence, automation, and cloud infrastructure management.',
        sampleQuestion: 'Describe a strategy for zero-downtime deployment in a Kubernetes cluster.',
        color: 'bg-orange-100 text-orange-700'
    }
]
