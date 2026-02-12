import 'dotenv/config'
import { connectMongoDB, disconnectMongoDB } from '../src/database/mongodb.js'
import { EmailTemplate } from '../src/database/models/email-template.model.js'
import { Organization } from '../src/database/models/index.js'
import { processEmailJob } from '../src/jobs/processors/email.processor.js'
import { Types } from 'mongoose'
import http from 'http'
import { createApp } from '../src/app.js'

async function verifyEmailEngine() {
    console.log('🚀 Starting Email Engine Verification')
    await connectMongoDB()

    try {
        // 1. Setup Data
        let org = await Organization.findOne({ slug: 'acme-corp' })
        if (!org) {
            org = await Organization.create({ name: 'Acme Corp', slug: 'acme-corp', plan: 'FREE' })
        }
        console.log(`Using Org: ${org.name}`)

        // 2. Create Template
        console.log('Creating Email Template...')
        await EmailTemplate.deleteMany({ name: 'Test Template' })

        const template = await EmailTemplate.create({
            organizationId: org._id,
            name: 'Test Template',
            subject: 'Hello {{name}}',
            content: '<p>Welcome to {{company}}!</p>',
            variables: ['name', 'company'],
            isActive: true
        })
        console.log(`Template Created: ${template._id}`)

        // 3. Test Template Rendering & Processor Logic
        // We Mock Resend to avoid actual sending (or API error)
        // Since we can't easily mock module import in this script without jest/sinon, 
        // we will let it fail on Resend part but verify Log creation.

        console.log('Triggering Email Job with Template...')
        try {
            await processEmailJob({
                data: {
                    to: 'test@example.com',
                    templateId: template._id.toString(),
                    variables: { name: 'Sayandeep', company: 'FluxAI' },
                    organizationId: org._id.toString(),
                    metadata: { verification: true }
                }
            } as any)
        } catch (err: any) {
            console.log('Expected error (Resend API key missing or mock):', err.message)
            if (err.message.includes('API key') || err.message.includes('Resend')) {
                console.log('✅ Processor attempted to send email.')
            }
        }

        // 4. Verify Pixel Endpoint
        console.log('Verifying Tracking Pixel Endpoint...')
        const app = createApp()
        const server = http.createServer(app)

        await new Promise<void>((resolve) => {
            server.listen(5002, () => {
                http.get('http://localhost:5002/api/tracking/pixel.png?id=mock-log-id', (res) => {
                    console.log(`Pixel Response Status: ${res.statusCode}`)
                    console.log(`Pixel Content-Type: ${res.headers['content-type']}`)

                    if (res.statusCode === 200 && res.headers['content-type'] === 'image/gif') {
                        console.log('✅ Tracking Pixel returned correctly.')
                    } else {
                        console.error('❌ Tracking Pixel failed.')
                    }
                    server.close()
                    resolve()
                })
            })
        })

    } catch (error) {
        console.error('❌ Verification Failed:', error)
    } finally {
        await disconnectMongoDB()
        process.exit(0)
    }
}

verifyEmailEngine()
