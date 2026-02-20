/**
 * Test script for Judge0 integration (DSA / coding round).
 * API reference: https://ce.judge0.com/
 *
 * Run: npm run test:judge0  (or npx tsx src/scripts/test-judge0.ts)
 * Requires Node 18+. Set JUDGE0_BASE_URL (default https://ce.judge0.com), JUDGE0_AUTH_TOKEN if required.
 */
import 'dotenv/config'
import {
    runCode,
    runTestCase,
    getJudge0LanguageId,
    authenticate,
} from '../services/judge0/judge0.client.js'

/** Judge0 CE status IDs (https://ce.judge0.com/ — Statuses): 3 = Accepted */
const JUDGE0_STATUS_ACCEPTED = 3

const BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com'
const AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || undefined
const RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || undefined
const RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST || undefined

const options = {
    authToken: AUTH_TOKEN,
    rapidApiKey: RAPIDAPI_KEY,
    rapidApiHost: RAPIDAPI_HOST,
}

function hasAuth(): boolean {
    return !!(AUTH_TOKEN || (RAPIDAPI_KEY && RAPIDAPI_HOST))
}

async function main() {
    if (typeof globalThis.fetch === 'undefined') {
        console.error('This script requires Node 18+ (for global fetch). Current:', process.version)
        process.exit(1)
    }
    console.log('Judge0 integration test (API: https://ce.judge0.com/)')
    console.log('====================================================')
    console.log('JUDGE0_BASE_URL:', BASE_URL)
    console.log('Auth:', hasAuth() ? 'configured' : 'none (ok if instance allows)')
    console.log('')

    // 0. Optional: verify token (POST /authenticate per Judge0 CE docs)
    if (AUTH_TOKEN) {
        console.log('0. Authenticate (POST /authenticate)')
        try {
            const ok = await authenticate(BASE_URL, options)
            console.log('   Result:', ok ? 'OK (token valid or auth disabled)' : 'FAIL (401 invalid token)')
            if (!ok) {
                console.error('   Fix JUDGE0_AUTH_TOKEN or remove it if instance has no auth.')
                process.exit(1)
            }
        } catch (err) {
            console.error('   FAIL:', err instanceof Error ? err.message : err)
            process.exit(1)
        }
        console.log('')
    }

    // 1. Create submission + get result (POST /submissions then GET /submissions/{token} when wait not allowed)
    console.log('1. Run Python: print("Hello from Judge0")')
    try {
        const langId = getJudge0LanguageId('python')
        if (langId == null) {
            console.error('   FAIL: Python language ID not found')
        } else {
            const result = await runCode(BASE_URL, 'print("Hello from Judge0")', langId, '', options)
            console.log('   Status:', result.statusDescription, '(id:', result.statusId + ')')
            console.log('   Accepted:', result.accepted)
            console.log('   Stdout:', result.stdout || '(empty)')
            if (result.stderr) console.log('   Stderr:', result.stderr)
            if (result.compileError) console.log('   Compile error:', result.compileError)
            if (result.timeSeconds != null) console.log('   Time:', result.timeSeconds + 's')
            if (result.memoryKb != null) console.log('   Memory:', result.memoryKb + ' KB')
            console.log('   OK')
        }
    } catch (err) {
        console.error('   FAIL:', err instanceof Error ? err.message : err)
    }

    console.log('')

    // 2. Run Python with stdin
    console.log('2. Run Python with stdin (read name, print greeting)')
    try {
        const langId = getJudge0LanguageId('python')
        if (langId == null) {
            console.error('   FAIL: Python language ID not found')
        } else {
            const code = `name = input().strip()\nprint(f"Hello, {name}!")`
            const result = await runCode(BASE_URL, code, langId, 'FluxAI', options)
            console.log('   Stdout:', result.stdout || '(empty)')
            const expected = 'Hello, FluxAI!'
            const match = result.stdout.trim() === expected
            console.log('   Expected:', expected, '| Match:', match ? 'OK' : 'FAIL')
        }
    } catch (err) {
        console.error('   FAIL:', err instanceof Error ? err.message : err)
    }

    console.log('')

    // 3. Run test case (like DSA evaluation)
    console.log('3. Run test case (runTestCase – like DSA evaluation)')
    try {
        const langId = getJudge0LanguageId('python')
        if (langId == null) {
            console.error('   FAIL: Python language ID not found')
        } else {
            const code = `a, b = map(int, input().split())\nprint(a + b)`
            const stdin = '2 3'
            const expectedStdout = '5'
            const { passed, result } = await runTestCase(BASE_URL, code, langId, stdin, expectedStdout, options)
            console.log('   Passed:', passed)
            console.log('   Stdout:', result.stdout || '(empty)')
            console.log('   Status:', result.statusDescription)
            console.log(passed ? '   OK' : '   FAIL (output did not match expected)')
        }
    } catch (err) {
        console.error('   FAIL:', err instanceof Error ? err.message : err)
    }

    console.log('')
    console.log('Done. If all three steps show OK, Judge0 integration is working.')
}

main().catch((err) => {
    console.error('Script error:', err)
    process.exit(1)
})
