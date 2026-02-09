/**
 * Seed Questions Script
 * 
 * Populates the Question collection with mock data from the frontend question bank.
 * Run with: npx ts-node --esm src/scripts/seed-questions.ts
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Question } from '../database/models/index.js'

dotenv.config()

// ============================================
// MCQ Bank (matching frontend mock)
// ============================================
const mcqBank = [
    // DBMS
    {
        slug: 'dbms-1',
        title: 'Which normal form eliminates partial dependency?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correctOptions: [1],
        type: 'Single',
        category: 'DBMS',
        difficulty: 'MEDIUM'
    },
    {
        slug: 'dbms-2',
        title: 'Which of the following are ACID properties?',
        options: ['Atomicity', 'Consistency', 'Integrity', 'Durability'],
        correctOptions: [0, 1, 3],
        type: 'Multi',
        category: 'DBMS',
        difficulty: 'EASY'
    },
    {
        slug: 'dbms-3',
        title: 'What is the default isolation level in MySQL InnoDB?',
        options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
        correctOptions: [2],
        type: 'Single',
        category: 'DBMS',
        difficulty: 'HARD'
    },
    {
        slug: 'dbms-4',
        title: 'Select valid SQL constraints.',
        options: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'INDEX'],
        correctOptions: [0, 1, 2],
        type: 'Multi',
        category: 'DBMS',
        difficulty: 'EASY'
    },
    // OOPS
    {
        slug: 'oops-1',
        title: 'Which principle states that objects should be replaceable with instances of their subtypes?',
        options: ['Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
        correctOptions: [1],
        type: 'Single',
        category: 'OOPS',
        difficulty: 'MEDIUM'
    },
    {
        slug: 'oops-2',
        title: 'Which of the following support Polymorphism?',
        options: ['Method Overloading', 'Method Overriding', 'Encapsulation', 'Operator Overloading'],
        correctOptions: [0, 1, 3],
        type: 'Multi',
        category: 'OOPS',
        difficulty: 'MEDIUM'
    },
    // OS
    {
        slug: 'os-1',
        title: 'Which scheduling algorithm can cause starvation?',
        options: ['Round Robin', 'FCFS', 'SJF', 'Multilevel Queue'],
        correctOptions: [2],
        type: 'Single',
        category: 'Operating Systems',
        difficulty: 'MEDIUM'
    },
    {
        slug: 'os-2',
        title: 'What constitutes a Process Control Block (PCB)?',
        options: ['Process ID', 'Program Counter', 'CPU Registers', 'Heap Memory'],
        correctOptions: [0, 1, 2],
        type: 'Multi',
        category: 'Operating Systems',
        difficulty: 'HARD'
    },
    // React / Frontend
    {
        slug: 'fe-1',
        title: 'What is the primary purpose of useEffect?',
        options: ['State management', 'Side effects', 'Routing', 'Memoization'],
        correctOptions: [1],
        type: 'Single',
        category: 'Frontend',
        difficulty: 'EASY'
    },
    {
        slug: 'fe-2',
        title: 'Which of the following trigger a re-render in React?',
        options: ['State change', 'Prop change', 'Ref change', 'Parent re-render'],
        correctOptions: [0, 1, 3],
        type: 'Multi',
        category: 'Frontend',
        difficulty: 'MEDIUM'
    },
    // Generated Single Choice Questions
    ...Array.from({ length: 20 }).map((_, i) => ({
        slug: `gen-single-${i}`,
        title: `Sample Single Choice Question ${i + 1} regarding system architecture.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOptions: [0],
        type: 'Single',
        category: i % 2 === 0 ? 'Architecture' : 'DevOps',
        difficulty: i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD'
    })),
    // Generated Multi Choice Questions
    ...Array.from({ length: 10 }).map((_, i) => ({
        slug: `gen-multi-${i}`,
        title: `Sample Multiple Choice Question ${i + 1} regarding cloud patterns.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOptions: [0, 2],
        type: 'Multi',
        category: 'Cloud',
        difficulty: 'MEDIUM'
    }))
]

// ============================================
// DSA Bank (matching frontend mock)
// ============================================
const dsaBank = [
    {
        slug: 'dsa-1',
        title: 'Two Sum',
        prompt: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'EASY',
        topics: ['Array', 'Hash Table'],
        languagesSupported: ['JavaScript', 'Python', 'Java', 'C++'],
        starterCode: {
            javascript: 'function twoSum(nums, target) {\n\n}'
        },
        testCases: [
            { stdin: '[2,7,11,15]\n9', expectedStdout: '[0,1]' },
            { stdin: '[3,2,4]\n6', expectedStdout: '[1,2]' }
        ]
    },
    {
        slug: 'dsa-2',
        title: 'LRU Cache',
        prompt: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
        difficulty: 'MEDIUM',
        topics: ['Design', 'Hash Table', 'Linked List'],
        languagesSupported: ['JavaScript', 'Python', 'Java', 'C++'],
        starterCode: {
            javascript: 'class LRUCache {\n    constructor(capacity) {\n\n    }\n}'
        },
        testCases: []
    },
    {
        slug: 'dsa-3',
        title: 'Merge K Sorted Lists',
        prompt: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
        difficulty: 'HARD',
        topics: ['Linked List', 'Divide and Conquer', 'Heap'],
        languagesSupported: ['JavaScript', 'Python', 'Java', 'C++'],
        starterCode: {
            javascript: 'var mergeKLists = function(lists) {\n\n};'
        },
        testCases: []
    },
    {
        slug: 'dsa-4',
        title: 'Valid Parentheses',
        prompt: 'Given a string containing just the characters (, ), {, }, [ and ], determine if the input string is valid.',
        difficulty: 'EASY',
        topics: ['String', 'Stack'],
        languagesSupported: ['JavaScript', 'Python', 'Java'],
        starterCode: {
            javascript: 'var isValid = function(s) {\n\n};'
        },
        testCases: [
            { stdin: '()', expectedStdout: 'true' },
            { stdin: '()[]{}', expectedStdout: 'true' },
            { stdin: '(]', expectedStdout: 'false' }
        ]
    },
    {
        slug: 'dsa-5',
        title: 'Longest Substring Without Repeating Characters',
        prompt: 'Given a string s, find the length of the longest substring without repeating characters.',
        difficulty: 'MEDIUM',
        topics: ['String', 'Sliding Window', 'Hash Table'],
        languagesSupported: ['JavaScript', 'Python', 'Java'],
        starterCode: {
            javascript: 'var lengthOfLongestSubstring = function(s) {\n\n};'
        },
        testCases: [
            { stdin: 'abcabcbb', expectedStdout: '3' },
            { stdin: 'bbbbb', expectedStdout: '1' }
        ]
    },
    {
        slug: 'dsa-6',
        title: 'Trapping Rain Water',
        prompt: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        difficulty: 'HARD',
        topics: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
        languagesSupported: ['JavaScript', 'Python', 'Java'],
        starterCode: {
            javascript: 'var trap = function(height) {\n\n};'
        },
        testCases: [
            { stdin: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedStdout: '6' }
        ]
    }
]

async function seedQuestions() {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
        console.error('MONGODB_URI not set in environment')
        process.exit(1)
    }

    console.log('Connecting to MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('Connected!')

    // Seed MCQ questions
    console.log('\nSeeding MCQ questions...')
    let mcqCreated = 0
    let mcqSkipped = 0

    for (const q of mcqBank) {
        const exists = await Question.findOne({ slug: q.slug })
        if (exists) {
            mcqSkipped++
            continue
        }

        await Question.create({
            slug: q.slug,
            type: 'MCQ',
            title: q.title,
            difficulty: q.difficulty,
            topics: [q.category],
            mcqDetails: {
                options: q.options,
                correctOptions: q.correctOptions,
                isMultiCorrect: q.type === 'Multi'
            }
        })
        mcqCreated++
    }
    console.log(`  Created: ${mcqCreated}, Skipped (already exists): ${mcqSkipped}`)

    // Seed DSA questions
    console.log('\nSeeding DSA questions...')
    let dsaCreated = 0
    let dsaSkipped = 0

    for (const q of dsaBank) {
        const exists = await Question.findOne({ slug: q.slug })
        if (exists) {
            dsaSkipped++
            continue
        }

        await Question.create({
            slug: q.slug,
            type: 'DSA',
            title: q.title,
            difficulty: q.difficulty,
            topics: q.topics,
            dsaDetails: {
                prompt: q.prompt,
                starterCode: q.starterCode,
                languagesSupported: q.languagesSupported,
                testCases: q.testCases
            }
        })
        dsaCreated++
    }
    console.log(`  Created: ${dsaCreated}, Skipped (already exists): ${dsaSkipped}`)

    // Summary
    const totalQuestions = await Question.countDocuments()
    console.log(`\n✅ Seeding complete! Total questions in DB: ${totalQuestions}`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
}

seedQuestions().catch(err => {
    console.error('Seeding failed:', err)
    process.exit(1)
})
