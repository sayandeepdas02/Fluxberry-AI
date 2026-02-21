/**
 * Integration test for Judge0 CE flow (DSA Run Code + test case evaluation).
 * API reference: https://ce.judge0.com/
 *
 * Flow per docs:
 * - Create Submission: POST /submissions?base64_encoded=false&wait=false (ce.judge0.com has wait disabled)
 * - Get Submission: GET /submissions/{token} until status not In Queue (1) or Processing (2)
 * - Status 3 = Accepted (https://ce.judge0.com/ — Statuses and Languages → Get Statuses)
 *
 * Run: npm run test:judge0:flow  (or npx tsx src/scripts/judge0-flow.test.ts)
 * Requires Node 18+. Set JUDGE0_BASE_URL and optionally JUDGE0_AUTH_TOKEN in .env.
 */
import 'dotenv/config'
import assert from 'node:assert'
import {
    runCode,
    runTestCase,
    getJudge0LanguageId,
    authenticate,
} from '../services/judge0/judge0.client.js'

const BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com'
const AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || undefined
const options = {
    authToken: AUTH_TOKEN,
    rapidApiKey: process.env.JUDGE0_RAPIDAPI_KEY || undefined,
    rapidApiHost: process.env.JUDGE0_RAPIDAPI_HOST || undefined,
}

/** Judge0 CE: 1=In Queue, 2=Processing, 3=Accepted (https://ce.judge0.com/) */
const STATUS_ACCEPTED = 3

async function run() {
    if (typeof globalThis.fetch === 'undefined') {
        console.error('Node 18+ required for fetch. Current:', process.version)
        process.exit(1)
    }

    console.log('Judge0 CE flow test (https://ce.judge0.com/)')
    console.log('BASE_URL:', BASE_URL)
    console.log('')

    // 1. Authenticate (POST /authenticate) — 200 = valid token or auth disabled
    console.log('1. Authenticate (POST /authenticate)')
    const authOk = await authenticate(BASE_URL, options)
    assert.strictEqual(authOk, true, 'Authenticate should succeed (valid token or no auth)')
    console.log('   OK')
    console.log('')

    // 2. runCode: Create submission + poll GET /submissions/{token} → Accepted, stdout
    console.log('2. runCode: POST /submissions then GET /submissions/{token}')
    const langId = getJudge0LanguageId('python')
    assert.ok(langId != null, 'Python language_id should exist (71 per Judge0 CE languages)')

    const result1 = await runCode(
        BASE_URL,
        'print("Hello from Judge0")',
        langId,
        '',
        options
    )
    assert.strictEqual(
        result1.statusId,
        STATUS_ACCEPTED,
        `Expected status Accepted (3), got ${result1.statusId} ${result1.statusDescription}`
    )
    assert.ok(
        result1.stdout.includes('Hello from Judge0'),
        `Expected stdout to contain "Hello from Judge0", got: ${result1.stdout}`
    )
    assert.strictEqual(result1.accepted, true)
    console.log('   Status:', result1.statusDescription, '| stdout:', result1.stdout.trim())
    console.log('   OK')
    console.log('')

    // 3. runCode with stdin
    console.log('3. runCode with stdin')
    const code2 = `name = input().strip()\nprint(f"Hello, {name}!")`
    const result2 = await runCode(BASE_URL, code2, langId!, 'FluxAI', options)
    assert.strictEqual(result2.statusId, STATUS_ACCEPTED)
    assert.strictEqual(result2.stdout.trim(), 'Hello, FluxAI!')
    assert.strictEqual(result2.accepted, true)
    console.log('   OK')
    console.log('')

    // 4. runTestCase (DSA evaluation flow: expected_output comparison)
    console.log('4. runTestCase (DSA evaluation)')
    const code3 = `a, b = map(int, input().split())\nprint(a + b)`
    const { passed, result: result3 } = await runTestCase(
        BASE_URL,
        code3,
        langId!,
        '2 3',
        '5',
        options
    )
    assert.strictEqual(result3.statusId, STATUS_ACCEPTED)
    assert.strictEqual(result3.stdout.trim(), '5')
    assert.strictEqual(passed, true, 'Test case should pass')
    console.log('   OK')
    console.log('')

    console.log('All flow tests passed.')
}

run().catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : err)
    if (err instanceof assert.AssertionError) console.error(err.message)
    process.exit(1)
})
