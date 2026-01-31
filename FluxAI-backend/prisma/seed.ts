import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// MCQ Question data (20 single-correct + 10+ multi-correct)
const mcqQuestions = [
    // Single-correct (20 questions)
    {
        title: 'What is the time complexity of binary search?',
        difficulty: 'EASY' as const,
        topics: ['Algorithms', 'Searching'],
        isMultiCorrect: false,
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctOptions: [1],
    },
    {
        title: 'Which data structure uses LIFO principle?',
        difficulty: 'EASY' as const,
        topics: ['Data Structures'],
        isMultiCorrect: false,
        options: ['Queue', 'Stack', 'Linked List', 'Tree'],
        correctOptions: [0],
    },
    {
        title: 'What does REST stand for?',
        difficulty: 'EASY' as const,
        topics: ['Web Development', 'APIs'],
        isMultiCorrect: false,
        options: ['Representational State Transfer', 'Remote Service Technology', 'Reliable State Transition', 'Request State Transfer'],
        correctOptions: [0],
    },
    {
        title: 'Which HTTP method is idempotent?',
        difficulty: 'MEDIUM' as const,
        topics: ['Web Development', 'HTTP'],
        isMultiCorrect: false,
        options: ['POST', 'PUT', 'PATCH', 'None of the above'],
        correctOptions: [1],
    },
    {
        title: 'What is the default port for HTTPS?',
        difficulty: 'EASY' as const,
        topics: ['Networking'],
        isMultiCorrect: false,
        options: ['80', '443', '8080', '3000'],
        correctOptions: [1],
    },
    {
        title: 'Which sorting algorithm has the best average case complexity?',
        difficulty: 'MEDIUM' as const,
        topics: ['Algorithms', 'Sorting'],
        isMultiCorrect: false,
        options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
        correctOptions: [2],
    },
    {
        title: 'What is the space complexity of a recursive Fibonacci function?',
        difficulty: 'MEDIUM' as const,
        topics: ['Algorithms', 'Recursion'],
        isMultiCorrect: false,
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(2^n)'],
        correctOptions: [1],
    },
    {
        title: 'Which of these is not a JavaScript primitive type?',
        difficulty: 'EASY' as const,
        topics: ['JavaScript'],
        isMultiCorrect: false,
        options: ['String', 'Boolean', 'Array', 'Number'],
        correctOptions: [2],
    },
    {
        title: 'What is the CAP theorem about?',
        difficulty: 'HARD' as const,
        topics: ['Distributed Systems'],
        isMultiCorrect: false,
        options: ['Caching And Performance', 'Consistency, Availability, Partition tolerance', 'Concurrent Access Protocols', 'Client Application Protocol'],
        correctOptions: [1],
    },
    {
        title: 'Which design pattern ensures a class has only one instance?',
        difficulty: 'EASY' as const,
        topics: ['Design Patterns'],
        isMultiCorrect: false,
        options: ['Factory', 'Observer', 'Singleton', 'Strategy'],
        correctOptions: [2],
    },
    {
        title: 'What is the purpose of an index in a database?',
        difficulty: 'EASY' as const,
        topics: ['Databases'],
        isMultiCorrect: false,
        options: ['Store data', 'Speed up queries', 'Ensure data integrity', 'Backup data'],
        correctOptions: [1],
    },
    {
        title: 'What is Big O notation used for?',
        difficulty: 'EASY' as const,
        topics: ['Algorithms'],
        isMultiCorrect: false,
        options: ['Memory usage', 'Code readability', 'Algorithm efficiency', 'Error handling'],
        correctOptions: [2],
    },
    {
        title: 'Which protocol is connectionless?',
        difficulty: 'MEDIUM' as const,
        topics: ['Networking'],
        isMultiCorrect: false,
        options: ['TCP', 'UDP', 'HTTP', 'FTP'],
        correctOptions: [1],
    },
    {
        title: 'What is a deadlock?',
        difficulty: 'MEDIUM' as const,
        topics: ['Operating Systems'],
        isMultiCorrect: false,
        options: ['A type of virus', 'Circular wait for resources', 'Memory leak', 'CPU overload'],
        correctOptions: [1],
    },
    {
        title: 'What is the difference between == and === in JavaScript?',
        difficulty: 'EASY' as const,
        topics: ['JavaScript'],
        isMultiCorrect: false,
        options: ['No difference', '=== checks type too', '== is faster', '=== is deprecated'],
        correctOptions: [1],
    },
    {
        title: 'What is a JWT used for?',
        difficulty: 'MEDIUM' as const,
        topics: ['Security', 'Authentication'],
        isMultiCorrect: false,
        options: ['Encryption', 'Authentication tokens', 'Database queries', 'CSS styling'],
        correctOptions: [1],
    },
    {
        title: 'Which data structure is best for implementing a priority queue?',
        difficulty: 'MEDIUM' as const,
        topics: ['Data Structures'],
        isMultiCorrect: false,
        options: ['Array', 'Linked List', 'Heap', 'Stack'],
        correctOptions: [2],
    },
    {
        title: 'What is polymorphism in OOP?',
        difficulty: 'MEDIUM' as const,
        topics: ['OOP'],
        isMultiCorrect: false,
        options: ['Multiple inheritance', 'Same interface different implementations', 'Private methods', 'Static typing'],
        correctOptions: [1],
    },
    {
        title: 'What is the purpose of a load balancer?',
        difficulty: 'MEDIUM' as const,
        topics: ['System Design'],
        isMultiCorrect: false,
        options: ['Increase CPU speed', 'Distribute traffic', 'Compress data', 'Encrypt connections'],
        correctOptions: [1],
    },
    {
        title: 'What is sharding in databases?',
        difficulty: 'HARD' as const,
        topics: ['Databases', 'Scaling'],
        isMultiCorrect: false,
        options: ['Backup strategy', 'Horizontal partitioning', 'Data compression', 'Query optimization'],
        correctOptions: [1],
    },
    // Multi-correct (10+ questions)
    {
        title: 'Which of the following are valid HTTP methods?',
        difficulty: 'EASY' as const,
        topics: ['Web Development', 'HTTP'],
        isMultiCorrect: true,
        options: ['GET', 'POST', 'SEND', 'DELETE'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are characteristics of NoSQL databases?',
        difficulty: 'MEDIUM' as const,
        topics: ['Databases'],
        isMultiCorrect: true,
        options: ['Schema-less', 'ACID compliant always', 'Horizontally scalable', 'Document-based possible'],
        correctOptions: [0, 2, 3],
    },
    {
        title: 'Which are valid JavaScript array methods?',
        difficulty: 'EASY' as const,
        topics: ['JavaScript'],
        isMultiCorrect: true,
        options: ['map', 'filter', 'select', 'reduce'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are principles of REST?',
        difficulty: 'MEDIUM' as const,
        topics: ['APIs', 'Web Development'],
        isMultiCorrect: true,
        options: ['Stateless', 'Client-Server', 'Persistent connections required', 'Uniform interface'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are valid SQL JOIN types?',
        difficulty: 'MEDIUM' as const,
        topics: ['Databases', 'SQL'],
        isMultiCorrect: true,
        options: ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'PARALLEL JOIN'],
        correctOptions: [0, 1, 2],
    },
    {
        title: 'Which are features of microservices architecture?',
        difficulty: 'HARD' as const,
        topics: ['System Design'],
        isMultiCorrect: true,
        options: ['Independent deployment', 'Shared database', 'Loose coupling', 'Single codebase'],
        correctOptions: [0, 2],
    },
    {
        title: 'Which are valid Git commands?',
        difficulty: 'EASY' as const,
        topics: ['Git', 'Version Control'],
        isMultiCorrect: true,
        options: ['git push', 'git pull', 'git sync', 'git merge'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are OOP principles?',
        difficulty: 'EASY' as const,
        topics: ['OOP'],
        isMultiCorrect: true,
        options: ['Encapsulation', 'Inheritance', 'Normalization', 'Polymorphism'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are benefits of caching?',
        difficulty: 'MEDIUM' as const,
        topics: ['System Design', 'Performance'],
        isMultiCorrect: true,
        options: ['Reduced latency', 'Lower database load', 'Data always fresh', 'Improved throughput'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are valid React hooks?',
        difficulty: 'EASY' as const,
        topics: ['React', 'JavaScript'],
        isMultiCorrect: true,
        options: ['useState', 'useEffect', 'useClass', 'useContext'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are characteristics of functional programming?',
        difficulty: 'MEDIUM' as const,
        topics: ['Programming Paradigms'],
        isMultiCorrect: true,
        options: ['Immutability', 'Pure functions', 'Mutable state', 'First-class functions'],
        correctOptions: [0, 1, 3],
    },
    {
        title: 'Which are valid CSS display values?',
        difficulty: 'EASY' as const,
        topics: ['CSS', 'Web Development'],
        isMultiCorrect: true,
        options: ['flex', 'grid', 'table', 'parallel'],
        correctOptions: [0, 1, 2],
    },
]

// DSA Question data (5+ questions)
const dsaQuestions = [
    {
        title: 'Two Sum',
        difficulty: 'EASY' as const,
        topics: ['Arrays', 'Hash Table'],
        prompt: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]`,
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
        starterCode: {
            javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
            python: 'def two_sum(nums, target):\n    # Your code here\n    pass',
            typescript: 'function twoSum(nums: number[], target: number): number[] {\n  // Your code here\n}',
        },
        languagesSupported: ['javascript', 'python', 'typescript'],
    },
    {
        title: 'Reverse Linked List',
        difficulty: 'EASY' as const,
        topics: ['Linked List', 'Recursion'],
        prompt: `Given the head of a singly linked list, reverse the list, and return the reversed list.

**Example 1:**
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

**Example 2:**
Input: head = [1,2]
Output: [2,1]`,
        constraints: 'The number of nodes in the list is the range [0, 5000]\n-5000 <= Node.val <= 5000',
        starterCode: {
            javascript: 'function reverseList(head) {\n  // Your code here\n}',
            python: 'def reverse_list(head):\n    # Your code here\n    pass',
            typescript: 'function reverseList(head: ListNode | null): ListNode | null {\n  // Your code here\n}',
        },
        languagesSupported: ['javascript', 'python', 'typescript'],
    },
    {
        title: 'Valid Parentheses',
        difficulty: 'EASY' as const,
        topics: ['Stack', 'String'],
        prompt: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
Input: s = "()"
Output: true

**Example 2:**
Input: s = "()[]{}"
Output: true

**Example 3:**
Input: s = "(]"
Output: false`,
        constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'',
        starterCode: {
            javascript: 'function isValid(s) {\n  // Your code here\n}',
            python: 'def is_valid(s):\n    # Your code here\n    pass',
            typescript: 'function isValid(s: string): boolean {\n  // Your code here\n}',
        },
        languagesSupported: ['javascript', 'python', 'typescript'],
    },
    {
        title: 'Maximum Subarray',
        difficulty: 'MEDIUM' as const,
        topics: ['Arrays', 'Dynamic Programming', 'Divide and Conquer'],
        prompt: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

**Example 1:**
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

**Example 2:**
Input: nums = [1]
Output: 1

**Example 3:**
Input: nums = [5,4,-1,7,8]
Output: 23`,
        constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
        starterCode: {
            javascript: 'function maxSubArray(nums) {\n  // Your code here\n}',
            python: 'def max_sub_array(nums):\n    # Your code here\n    pass',
            typescript: 'function maxSubArray(nums: number[]): number {\n  // Your code here\n}',
        },
        languagesSupported: ['javascript', 'python', 'typescript'],
    },
    {
        title: 'Merge Two Sorted Lists',
        difficulty: 'EASY' as const,
        topics: ['Linked List', 'Recursion'],
        prompt: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

**Example 1:**
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]

**Example 2:**
Input: list1 = [], list2 = []
Output: []`,
        constraints: 'The number of nodes in both lists is in the range [0, 50]\n-100 <= Node.val <= 100',
        starterCode: {
            javascript: 'function mergeTwoLists(list1, list2) {\n  // Your code here\n}',
            python: 'def merge_two_lists(list1, list2):\n    # Your code here\n    pass',
            typescript: 'function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n  // Your code here\n}',
        },
        languagesSupported: ['javascript', 'python', 'typescript'],
    },
    {
        title: 'LRU Cache',
        difficulty: 'HARD' as const,
        topics: ['Hash Table', 'Linked List', 'Design'],
        prompt: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.

**Example:**
Input: ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
Output: [null, null, null, 1, null, -1, null, -1, 3, 4]`,
        constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put.',
        starterCode: {
            javascript: 'class LRUCache {\n  constructor(capacity) {\n    // Your code here\n  }\n\n  get(key) {\n    // Your code here\n  }\n\n  put(key, value) {\n    // Your code here\n  }\n}',
            python: 'class LRUCache:\n    def __init__(self, capacity: int):\n        # Your code here\n        pass\n\n    def get(self, key: int) -> int:\n        # Your code here\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Your code here\n        pass',
            typescript: 'class LRUCache {\n  constructor(capacity: number) {\n    // Your code here\n  }\n\n  get(key: number): number {\n    // Your code here\n  }\n\n  put(key: number, value: number): void {\n    // Your code here\n  }\n}',
        },
        languagesSupported: ['javascript', 'python', 'typescript'],
    },
]

async function main() {
    console.log('🌱 Seeding question bank...')

    // Clear existing questions
    await prisma.mCQDetails.deleteMany()
    await prisma.dSADetails.deleteMany()
    await prisma.question.deleteMany()

    // Seed MCQ questions
    console.log(`📝 Creating ${mcqQuestions.length} MCQ questions...`)
    for (const q of mcqQuestions) {
        await prisma.question.create({
            data: {
                type: 'MCQ',
                title: q.title,
                difficulty: q.difficulty,
                topics: q.topics,
                mcqDetails: {
                    create: {
                        options: q.options,
                        correctOptions: q.correctOptions,
                        isMultiCorrect: q.isMultiCorrect,
                    },
                },
            },
        })
    }

    // Seed DSA questions
    console.log(`💻 Creating ${dsaQuestions.length} DSA questions...`)
    for (const q of dsaQuestions) {
        await prisma.question.create({
            data: {
                type: 'DSA',
                title: q.title,
                difficulty: q.difficulty,
                topics: q.topics,
                dsaDetails: {
                    create: {
                        prompt: q.prompt,
                        constraints: q.constraints,
                        starterCode: q.starterCode,
                        languagesSupported: q.languagesSupported,
                    },
                },
            },
        })
    }

    console.log('✅ Seeding complete!')
    console.log(`   MCQ: ${mcqQuestions.filter(q => !q.isMultiCorrect).length} single-correct, ${mcqQuestions.filter(q => q.isMultiCorrect).length} multi-correct`)
    console.log(`   DSA: ${dsaQuestions.length} questions`)
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
