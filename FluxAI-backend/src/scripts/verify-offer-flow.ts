import 'dotenv/config'
import { connectMongoDB, disconnectMongoDB } from '../database/mongodb.js'
import { OfferTemplate, Offer, Organization, JobApplication, Candidate, OfferStatus } from '../database/models/index.js'
import { offersService } from '../modules/offers/offers.service.js'
import { v4 as uuidv4 } from 'uuid'
import { Types } from 'mongoose'

async function main() {
    try {
        console.log('🚀 Starting Verification: Advanced Offer System')
        await connectMongoDB()

        // 1. Setup Dummy Data
        console.log('1. Setting up dummy data...')
        const orgId = new Types.ObjectId()
        const candidateId = new Types.ObjectId()
        const applicationId = new Types.ObjectId()

        // Create dummy organization if needed (Schema requires valid refs usually, but for unit test like this we might get away with just IDs if service doesn't populate immediately, except creating template/offer)
        // Actually, createOffer checks JobApplication existence. So we must create valid docs.

        await Organization.create({
            _id: orgId,
            name: 'Test Org ' + Date.now(),
            slug: 'test-org-' + Date.now(),
            // ownerId removed as it not in schema
        })

        await Candidate.create({
            _id: candidateId,
            organizationId: orgId,
            email: `test-${Date.now()}@example.com`,
            firstName: 'John',
            lastName: 'Doe',
        })

        await JobApplication.create({
            _id: applicationId,
            organizationId: orgId,
            candidateId: candidateId,
            jobId: new Types.ObjectId(),
            status: 'INTERVIEW',
        })

        console.log('   ✅ Dummy data created')

        // 2. Create Template
        console.log('2. Creating Offer Template...')
        const templateContent = `
            <h1>Offer Letter</h1>
            <p>Dear {{candidateName}},</p>
            <p>We are pleased to offer you the position of {{role}} at {{company}}.</p>
            <p>Salary: {{salary}}</p>
            <p>Date: {{date}}</p>
            <div class="signature-section">
                <p>Signature:</p>
                <!-- signature placeholder -->
            </div>
        `

        const template = await OfferTemplate.create({
            organizationId: orgId,
            name: 'Standard Offer',
            content: templateContent,
            variables: ['candidateName', 'role', 'company', 'salary', 'date'],
            variableSchema: {
                candidateName: { type: 'text', label: 'Candidate Name' },
                role: { type: 'text', label: 'Role' },
                salary: { type: 'number', label: 'Annual Salary' },
                date: { type: 'date', label: 'Start Date' }
            },
            isActive: true
        })
        console.log('   ✅ Template created:', template._id)

        // 3. Create Offer (Generate Unsigned PDF)
        console.log('3. Creating Offer (Generating PDF)...')
        const variables = {
            candidateName: 'John Doe',
            role: 'Senior Engineer',
            company: 'Fluxberry AI',
            salary: '$150,000',
            date: new Date().toLocaleDateString()
        }

        const offer = await offersService.createOffer(
            orgId.toString(),
            applicationId.toString(),
            template._id.toString(),
            variables,
            7 // expires in 7 days
        )

        console.log('   ✅ Offer created:', offer._id)
        console.log('   📄 Unsigned PDF URL:', offer.pdfUrl)

        if (!offer.pdfUrl) throw new Error('Unsigned PDF URL missing')

        // 3.5. Send Offer (Generate Token)
        console.log('3.5. Sending Offer (Generating Token)...')
        const sentOffer = await offersService.sendOffer(offer._id.toString(), orgId.toString())
        console.log('   ✅ Offer Sent. Token:', sentOffer.token)

        if (!sentOffer.token) throw new Error('Token missing after sending offer')

        // 4. Accept Offer (Sign and Generate Signed PDF)
        console.log('4. Accepting Offer (Signing)...')

        const signatureData = {
            name: 'John Doe',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 pixel
            ip: '127.0.0.1',
            userAgent: 'TestScript/1.0'
        }

        const signedOffer = await offersService.acceptOffer(
            sentOffer.token, // USE TOKEN HERE
            signatureData
        )

        console.log('   ✅ Offer Accepted:', signedOffer.status)
        console.log('   📄 Signed PDF URL:', signedOffer.signedPdfUrl)
        console.log('   ✍️ Signature Metadata:', signedOffer.signature)

        if (signedOffer.status !== OfferStatus.ACCEPTED) throw new Error('Status not updated to ACCEPTED')
        if (!signedOffer.signedPdfUrl) throw new Error('Signed PDF URL missing')
        if (!signedOffer.acceptedAt) throw new Error('AcceptedAt timestamp missing')

        console.log('🎉 Verification Successful!')

    } catch (error: any) {
        console.error('❌ Verification Failed:', error)
        console.error(error.stack)
        process.exit(1)
    } finally {
        await disconnectMongoDB()
        process.exit(0)
    }
}

main()
