/**
 * Integration tests for Ribbon webhook handler.
 *
 * Tests: 401 when signature missing or invalid; 200 when signature valid and payload accepted
 * (unknown interview_id is handled idempotently with 200).
 *
 * Run: npm run test:ribbon:webhook
 * Requires: Backend running (e.g. npm run dev). Set RIBBON_WEBHOOK_SECRET in .env so the
 * server uses the same secret (e.g. test-secret-for-ci) for the "valid signature" test.
 */
import 'dotenv/config'
import assert from 'node:assert'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.RIBBON_WEBHOOK_SECRET || 'test-secret-for-ci'

function buildSignedPayload(payload: object, secret: string): { body: Buffer; signature: string } {
    const body = Buffer.from(JSON.stringify(payload), 'utf8')
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
    return { body, signature }
}

async function testInvalidSignatureReturns401() {
    console.log('Test: Invalid signature → 401')
    const payload = {
        event_type: 'interview_processed',
        interview_id: 'unknown-id',
        interview_flow_id: 'flow-1',
    }
    const { body, signature } = buildSignedPayload(payload, WEBHOOK_SECRET)
    const badSignature = signature.slice(0, -1) + 'x'

    const res = await fetch(process.env.API_URL || 'http://localhost:5001/api/webhooks/ribbon', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Ribbon-Signature': badSignature,
        },
        body: body.toString('utf8'),
    })
    assert.strictEqual(res.status, 401, 'Expected 401 for invalid signature')
    console.log('   OK')
}

async function testValidSignatureUnknownInterviewReturns200() {
    console.log('Test: Valid signature + unknown interview_id → 200')
    const payload = {
        event_type: 'interview_processed',
        interview_id: '00000000-0000-0000-0000-000000000000',
        interview_flow_id: 'flow-1',
    }
    const { body, signature } = buildSignedPayload(payload, WEBHOOK_SECRET)

    const res = await fetch(process.env.API_URL || 'http://localhost:5001/api/webhooks/ribbon', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Ribbon-Signature': signature,
        },
        body: body.toString('utf8'),
    })
    assert.strictEqual(res.status, 200, 'Webhook should return 200 for unknown interview (idempotent)')
    const data = await res.json() as any
    assert.strictEqual(data.success, true)
    console.log('   OK')
}

async function testMissingSignatureReturns401() {
    console.log('Test: Missing X-Ribbon-Signature → 401')
    const payload = { event_type: 'interview_processed', interview_id: 'x', interview_flow_id: 'y' }
    const body = Buffer.from(JSON.stringify(payload), 'utf8')

    const res = await fetch(process.env.API_URL || 'http://localhost:5001/api/webhooks/ribbon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body.toString('utf8'),
    })
    assert.strictEqual(res.status, 401, 'Expected 401 when signature missing')
    console.log('   OK')
}

async function run() {
    if (typeof globalThis.fetch === 'undefined') {
        console.error('Node 18+ required for fetch.')
        process.exit(1)
    }

    console.log('Ribbon webhook integration tests')
    console.log('API_URL:', process.env.API_URL || 'http://localhost:5001')
    console.log('')

    try {
        await testMissingSignatureReturns401()
        await testInvalidSignatureReturns401()
        await testValidSignatureUnknownInterviewReturns200()
    } catch (err) {
        if (err instanceof Error && err.message?.includes('fetch failed')) {
            console.error('Backend may not be running. Start with: npm run dev')
            console.error('Or set API_URL to your backend URL.')
        }
        throw err
    }

    console.log('')
    console.log('All webhook integration tests passed.')
}

run().catch((err) => {
    console.error('FAIL:', err instanceof Error ? err.message : err)
    process.exit(1)
})
