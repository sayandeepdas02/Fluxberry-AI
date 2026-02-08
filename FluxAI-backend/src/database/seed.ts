/**
 * Seed questions so backend has the same IDs as the frontend mock bank.
 * Run: npm run seed (requires MONGODB_URI).
 * Publish validation (MCQ 20+10, DSA 4) will then find these by slug.
 */
import { connectMongoDB, disconnectMongoDB } from './mongodb.js'
import { Question } from './models/index.js'

const mcqSeed = [
    { slug: 'dbms-1', title: 'Which normal form eliminates partial dependency?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctOptions: [1], isMultiCorrect: false, difficulty: 'MEDIUM' as const, topics: ['DBMS'] },
    { slug: 'dbms-2', title: 'Which of the following are ACID properties?', options: ['Atomicity', 'Consistency', 'Integrity', 'Durability'], correctOptions: [0, 1, 3], isMultiCorrect: true, difficulty: 'EASY' as const, topics: ['DBMS'] },
    { slug: 'dbms-3', title: 'What is the default isolation level in MySQL InnoDB?', options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'], correctOptions: [2], isMultiCorrect: false, difficulty: 'HARD' as const, topics: ['DBMS'] },
    { slug: 'dbms-4', title: 'Select valid SQL constraints.', options: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'INDEX'], correctOptions: [0, 1, 2], isMultiCorrect: true, difficulty: 'EASY' as const, topics: ['DBMS'] },
    { slug: 'oops-1', title: 'Which principle states that objects should be replaceable with instances of their subtypes?', options: ['Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'], correctOptions: [1], isMultiCorrect: false, difficulty: 'MEDIUM' as const, topics: ['OOPS'] },
    { slug: 'oops-2', title: 'Which of the following support Polymorphism?', options: ['Method Overloading', 'Method Overriding', 'Encapsulation', 'Operator Overloading'], correctOptions: [0, 1, 3], isMultiCorrect: true, difficulty: 'MEDIUM' as const, topics: ['OOPS'] },
    { slug: 'os-1', title: 'Which scheduling algorithm can cause starvation?', options: ['Round Robin', 'FCFS', 'SJF', 'Multilevel Queue'], correctOptions: [2], isMultiCorrect: false, difficulty: 'MEDIUM' as const, topics: ['Operating Systems'] },
    { slug: 'os-2', title: 'What constitutes a Process Control Block (PCB)?', options: ['Process ID', 'Program Counter', 'CPU Registers', 'Heap Memory'], correctOptions: [0, 1, 2], isMultiCorrect: true, difficulty: 'HARD' as const, topics: ['Operating Systems'] },
    { slug: 'fe-1', title: 'What is the primary purpose of useEffect?', options: ['State management', 'Side effects', 'Routing', 'Memoization'], correctOptions: [1], isMultiCorrect: false, difficulty: 'EASY' as const, topics: ['Frontend'] },
    { slug: 'fe-2', title: 'Which of the following trigger a re-render in React?', options: ['State change', 'Prop change', 'Ref change', 'Parent re-render'], correctOptions: [0, 1, 3], isMultiCorrect: true, difficulty: 'MEDIUM' as const, topics: ['Frontend'] },
]
for (let i = 0; i < 20; i++) {
    mcqSeed.push({ slug: `gen-single-${i}`, title: `Sample Single Choice Question ${i + 1}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOptions: [0], isMultiCorrect: false, difficulty: (i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD') as 'EASY' | 'MEDIUM' | 'HARD', topics: [i % 2 === 0 ? 'Architecture' : 'DevOps'] })
}
for (let i = 0; i < 10; i++) {
    mcqSeed.push({ slug: `gen-multi-${i}`, title: `Sample Multiple Choice Question ${i + 1}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOptions: [0, 2], isMultiCorrect: true, difficulty: 'MEDIUM' as const, topics: ['Cloud'] })
}

const dsaSeed = [
    { slug: 'dsa-1', title: 'Two Sum', prompt: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', difficulty: 'EASY' as const, topics: ['Array', 'Hash Table'], starterCode: { javascript: 'function twoSum(nums, target) {\n\n}' }, languagesSupported: ['JavaScript', 'Python', 'Java', 'C++'] },
    { slug: 'dsa-2', title: 'LRU Cache', prompt: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.', difficulty: 'MEDIUM' as const, topics: ['Design', 'Hash Table', 'Linked List'], starterCode: { javascript: 'class LRUCache {\n    constructor(capacity) {\n\n    }\n}' }, languagesSupported: ['JavaScript', 'Python', 'Java', 'C++'] },
    { slug: 'dsa-3', title: 'Merge K Sorted Lists', prompt: 'Merge all the linked-lists into one sorted linked-list and return it.', difficulty: 'HARD' as const, topics: ['Linked List', 'Divide and Conquer', 'Heap'], starterCode: { javascript: 'var mergeKLists = function(lists) {\n\n};' }, languagesSupported: ['JavaScript', 'Python', 'Java', 'C++'] },
    { slug: 'dsa-4', title: 'Valid Parentheses', prompt: 'Determine if the input string is valid.', difficulty: 'EASY' as const, topics: ['String', 'Stack'], starterCode: { javascript: 'var isValid = function(s) {\n\n};' }, languagesSupported: ['JavaScript', 'Python', 'Java'] },
    { slug: 'dsa-5', title: 'Longest Substring Without Repeating Characters', prompt: 'Find the length of the longest substring without repeating characters.', difficulty: 'MEDIUM' as const, topics: ['String', 'Sliding Window', 'Hash Table'], starterCode: { javascript: 'var lengthOfLongestSubstring = function(s) {\n\n};' }, languagesSupported: ['JavaScript', 'Python', 'Java'] },
    { slug: 'dsa-6', title: 'Trapping Rain Water', prompt: 'Compute how much water it can trap after raining.', difficulty: 'HARD' as const, topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'], starterCode: { javascript: 'var trap = function(height) {\n\n};' }, languagesSupported: ['JavaScript', 'Python', 'Java'] },
]

async function seed() {
    await connectMongoDB()

    for (const q of mcqSeed) {
        await Question.updateOne(
            { slug: q.slug },
            {
                $setOnInsert: {
                    slug: q.slug,
                    type: 'MCQ',
                    title: q.title,
                    difficulty: q.difficulty,
                    topics: q.topics,
                    mcqDetails: { options: q.options, correctOptions: q.correctOptions, isMultiCorrect: q.isMultiCorrect },
                },
            },
            { upsert: true }
        )
    }
    for (const q of dsaSeed) {
        await Question.updateOne(
            { slug: q.slug },
            {
                $setOnInsert: {
                    slug: q.slug,
                    type: 'DSA',
                    title: q.title,
                    difficulty: q.difficulty,
                    topics: q.topics,
                    dsaDetails: { prompt: q.prompt, starterCode: q.starterCode, languagesSupported: q.languagesSupported },
                },
            },
            { upsert: true }
        )
    }

    console.log('Seeded', mcqSeed.length, 'MCQ and', dsaSeed.length, 'DSA questions (by slug).')
    await disconnectMongoDB()
    process.exit(0)
}

seed().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
})
