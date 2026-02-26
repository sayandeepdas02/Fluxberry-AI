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

        await Organization.create({
            _id: orgId,
            name: 'Test Org ' + Date.now(),
            slug: 'test-org-' + Date.now(),
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
            type: 'FULL_TIME',
            htmlContent: templateContent,
            variables: ['candidateName', 'role', 'company', 'salary', 'date'],
            isActive: true
        })
        console.log('   ✅ Template created:', template._id)

        // 3. Create Offer Draft
        console.log('3. Creating Offer Draft...')
        const variables = {
            candidateName: 'John Doe',
            role: 'Senior Engineer',
            company: 'Fluxberry AI',
            salary: '$150,000',
            date: new Date().toLocaleDateString()
        }

        let offer = await offersService.createOfferDraft(
            orgId.toString(),
            applicationId.toString(),
            template._id.toString(),
            variables,
            7 // expires in 7 days
        )
        console.log('   ✅ Offer draft created:', offer._id)

        // 3.5 Generate PDF
        console.log('3.5 Generating PDF...')
        offer = await offersService.generateOfferPdf(offer._id.toString(), orgId.toString())

        console.log('   📄 Unsigned PDF URL:', offer.generatedPdfUrl)
        if (!offer.generatedPdfUrl) throw new Error('Unsigned PDF URL missing')

        // 4. Send Offer (Generate Token)
        console.log('4. Sending Offer (Generating Token)...')
        const sentOffer = await offersService.sendOfferEmail(offer._id.toString(), orgId.toString())
        console.log('   ✅ Offer Sent. Token:', sentOffer.publicToken)

        if (!sentOffer.publicToken) throw new Error('Token missing after sending offer')

        // 5. Accept Offer (Sign and Generate Signed PDF)
        console.log('5. Accepting Offer (Signing)...')

        const signatureData = {
            name: 'John Doe',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 pixel
            type: 'DRAWN' as 'DRAWN' | 'TYPED'
        }

        const signedOffer = await offersService.recordSignature(
            sentOffer.publicToken, // USE TOKEN HERE
            signatureData,
            '127.0.0.1'
        )

        console.log('   ✅ Offer Accepted:', signedOffer.status)
        console.log('   📄 Signed PDF URL:', signedOffer.signedPdfUrl)

        if (signedOffer.status !== OfferStatus.SIGNED) throw new Error('Status not updated to SIGNED')
        if (!signedOffer.signedPdfUrl) throw new Error('Signed PDF URL missing')
        if (!signedOffer.signedAt) throw new Error('signedAt timestamp missing')

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
