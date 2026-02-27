import 'dotenv/config'
import assert from 'node:assert'
import mongoose from 'mongoose'
import crypto from 'crypto'
import { Offer, Organization } from '../database/models/index.js'

const API_URL = process.env.API_URL || 'http://localhost:5001/api'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fluxberry'

async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI)
    }
}

async function createTestOffer(orgId: string, status: string, token: string, expiresAt?: Date, usedAt?: Date) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const offer = await Offer.create({
        organizationId: orgId,
        applicationId: new mongoose.Types.ObjectId(),
        candidateId: new mongoose.Types.ObjectId(),
        templateId: new mongoose.Types.ObjectId(),
        status,
        publicToken: tokenHash,
        tokenExpiresAt: expiresAt,
        tokenUsedAt: usedAt,
        snapshotHtml: '<p>Snapshot</p>'
    })
    return offer
}

async function runTests() {
    console.log('Testing Token Validation Middleware (Phase 2)')
    await connectDB()

    const org = await Organization.create({ name: 'Test Org Tokens', slug: 'test-org-tokens-' + Date.now() })
    const orgId = org._id.toString()

    try {
        // 1. Valid Token
        const validToken = 'valid-token-' + Date.now()
        await createTestOffer(orgId, 'SENT', validToken, new Date(Date.now() + 1000 * 60 * 60))

        let res = await fetch(`${API_URL}/public/offers/${validToken}`)
        assert.strictEqual(res.status, 200, 'Valid token should pass validation')

        // 2. Expired Token
        const expiredToken = 'expired-token-' + Date.now()
        await createTestOffer(orgId, 'SENT', expiredToken, new Date(Date.now() - 1000 * 60 * 60))

        res = await fetch(`${API_URL}/public/offers/${expiredToken}`)
        assert.strictEqual(res.status, 410, 'Expired token should return 410 Gone')
        let data = (await res.json()) as any
        assert.ok(data.error.includes('expired'), 'Error should mention expiration')

        // 3. Used Token
        const usedToken = 'used-token-' + Date.now()
        await createTestOffer(orgId, 'SIGNED', usedToken, new Date(Date.now() + 1000 * 60 * 60), new Date())

        res = await fetch(`${API_URL}/public/offers/${usedToken}`)
        assert.strictEqual(res.status, 410, 'Used token should return 410 Gone')
        data = (await res.json()) as any
        assert.ok(data.error.includes('consumed'), 'Error should mention consumption')

        // 4. Invalid Token
        res = await fetch(`${API_URL}/public/offers/invalid-token-123`)
        assert.strictEqual(res.status, 404, 'Invalid token should return 404')
        data = (await res.json()) as any
        assert.ok(data.error.includes('Invalid offer token'), 'Error should mention invalid token')

        console.log('✅ Token validation tests passed correctly!')
    } finally {
        await Organization.deleteOne({ _id: org._id })
        await mongoose.disconnect()
    }
}

runTests().catch(err => {
    console.error('FAIL:', err)
    process.exit(1)
})
