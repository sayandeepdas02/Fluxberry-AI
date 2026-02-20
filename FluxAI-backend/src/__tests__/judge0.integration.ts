/**
 * Backend test: verify Judge0 integration for our use case.
 * Use case: candidate submits code → we evaluate it against test cases (same as DSA round).
 * This test submits a piece of code and runs it through runTestCase, like processDSAEvaluation.
 * Run: npm run test:judge0:verify
 */
import 'dotenv/config'
import { runTestCase, getJudge0LanguageId } from '../services/judge0/judge0.client.js'

const BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com'
const options = {
    authToken: process.env.JUDGE0_AUTH_TOKEN || undefined,
    rapidApiKey: process.env.JUDGE0_RAPIDAPI_KEY || undefined,
    rapidApiHost: process.env.JUDGE0_RAPIDAPI_HOST || undefined,
}

/** Simulates a candidate-submitted solution: read two integers, print their sum. */
const SUBMITTED_CODE = `a, b = map(int, input().split())
print(a + b)`

async function verify() {
    if (typeof globalThis.fetch === 'undefined') {
        console.error('Judge0 verify: Node 18+ required (fetch). Current:', process.version)
        process.exit(1)
    }

    const langId = getJudge0LanguageId('python')
    if (langId == null) {
        console.error('Judge0 verify: Python language ID not found')
        process.exit(1)
    }

    // Same flow as DSA evaluation: run submitted code against a test case (stdin + expected stdout)
    const stdin = '2 3'
    const expectedStdout = '5'
    const { passed, result } = await runTestCase(
        BASE_URL,
        SUBMITTED_CODE,
        langId,
        stdin,
        expectedStdout,
        options
    )

    if (!passed) {
        console.error('Judge0 verify FAIL: test case did not pass (submitted code vs expected output)')
        console.error('  stdin:', stdin, '| expected stdout:', expectedStdout)
        console.error('  got status:', result.statusDescription, '| stdout:', result.stdout || '(empty)')
        if (result.stderr) console.error('  stderr:', result.stderr)
        if (result.compileError) console.error('  compile:', result.compileError)
        process.exit(1)
    }

    console.log('Judge0 verify OK (submitted code ran against test case and passed)')
}

verify().catch((err) => {
    console.error('Judge0 verify FAIL:', err instanceof Error ? err.message : err)
    process.exit(1)
})
