/**
 * End-to-end flow test for Ribbon API integration.
 *
 * 1. createFlow – create an interview flow with questions, redirect_url, webhook_url.
 * 2. createInterview – create a one-use interview; get interview_id and interview_link.
 * 3. getInterview – fetch interview (will be "incomplete" until candidate completes it).
 *
 * Run: npm run test:ribbon:flow  (or npx tsx src/scripts/ribbon-api.flow.test.ts)
 * Requires: RIBBON_API_KEY in .env. Optionally FRONTEND_URL, BACKEND_PUBLIC_URL, RIBBON_WEBHOOK_SECRET.
 */
import 'dotenv/config'
import assert from 'node:assert'
import {
    isRibbonConfigured,
    createFlow,
    createInterview,
    getInterview,
} from '../services/ribbon/ribbon.client.js'

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000'
const BACKEND_PUBLIC = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5001'
const REDIRECT_URL = `${FRONTEND_ORIGIN.replace(/\/$/, '')}/assessment/ribbon-callback`
const WEBHOOK_URL = `${BACKEND_PUBLIC.replace(/\/$/, '')}/api/webhooks/ribbon`
const WEBHOOK_SECRET = process.env.RIBBON_WEBHOOK_SECRET || ''

async function run() {
    if (typeof globalThis.fetch === 'undefined') {
        console.error('Node 18+ required for fetch. Current:', process.version)
        process.exit(1)
    }

    if (!isRibbonConfigured()) {
        console.log('Skipping Ribbon flow test: RIBBON_API_KEY not set')
        process.exit(0)
    }

    console.log('Ribbon API flow test')
    console.log('Redirect URL:', REDIRECT_URL)
    console.log('Webhook URL:', WEBHOOK_URL)
    console.log('')

    // 1. Create flow
    console.log('1. Create interview flow (POST /v1/interview-flows)')
    const flowRes = await createFlow({
        org_name: 'FluxAI Test',
        title: 'E2E Test – AI Round',
        questions: [
            'Tell me about yourself.',
            'Describe a technical challenge you solved.',
        ],
        redirect_url: REDIRECT_URL,
        webhook_url: WEBHOOK_URL,
        webhook_secret_key: WEBHOOK_SECRET || undefined,
        interview_type: 'general',
    })
    assert.ok(flowRes.interview_flow_id, 'Should return interview_flow_id')
    console.log('   interview_flow_id:', flowRes.interview_flow_id)
    console.log('   OK')
    console.log('')

    // 2. Create interview
    console.log('2. Create interview (POST /v1/interviews)')
    const interviewRes = await createInterview(flowRes.interview_flow_id, {
        interviewee_email_address: 'test@example.com',
        interviewee_first_name: 'Test',
        interviewee_last_name: 'User',
    })
    assert.ok(interviewRes.interview_id, 'Should return interview_id')
    assert.ok(interviewRes.interview_link, 'Should return interview_link')
    assert.ok(
        interviewRes.interview_link.includes(interviewRes.interview_id) || interviewRes.interview_link.startsWith('http'),
        'interview_link should be a valid URL'
    )
    console.log('   interview_id:', interviewRes.interview_id)
    console.log('   interview_link:', interviewRes.interview_link.slice(0, 60) + '...')
    console.log('   OK')
    console.log('')

    // 3. Get interview (incomplete until candidate completes)
    console.log('3. Get interview (GET /v1/interviews/:id)')
    const getRes = await getInterview(interviewRes.interview_id)
    assert.strictEqual(getRes.interview_id, interviewRes.interview_id)
    assert.ok(getRes.status === 'incomplete' || getRes.status === 'completed', 'status should be incomplete or completed')
    assert.strictEqual(getRes.interview_flow_id, flowRes.interview_flow_id)
    if (getRes.status === 'incomplete') {
        assert.ok(getRes.interview_data === null, 'interview_data should be null when incomplete')
    }
    console.log('   status:', getRes.status)
    console.log('   OK')
    console.log('')

    console.log('All Ribbon API flow tests passed.')
    console.log('To test full E2E: open interview_link in a browser, complete the interview,')
    console.log('then verify webhook is received and getInterview returns status "completed".')
}

run().catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : err)
    if (err instanceof assert.AssertionError) console.error(err.message)
    process.exit(1)
})
