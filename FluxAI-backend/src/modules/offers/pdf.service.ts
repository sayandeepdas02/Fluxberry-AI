import puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'
import { isS3Configured, uploadFile } from '../storage/s3.client.js'
import fs from 'fs'
import path from 'path'

export class PdfService {

    async generatePdf(html: string): Promise<Buffer> {
        let browser = null
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            })
            const page = await browser.newPage()

            // Set content with valid HTML structure if missing
            const fullHtml = html.includes('<html>') ? html : `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; line-height: 1.6; }
                        .signature-section { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
                        .signature-img { max-height: 100px; }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `

            await page.setContent(fullHtml, { waitUntil: 'networkidle0' })

            // Generate PDF
            const pdfUint8Array = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            })

            return Buffer.from(pdfUint8Array)
        } catch (error) {
            console.error('PDF Generation Error:', error)
            throw error
        } finally {
            if (browser) await browser.close()
        }
    }

    async uploadPdf(buffer: Buffer, organizationId: string, offerId: string, type: 'unsigned' | 'signed'): Promise<string> {
        const key = `organizations/${organizationId}/offers/${offerId}/${type}_${Date.now()}.pdf`

        // Use the new uploadFile method which handles S3 vs Local
        return await uploadFile(key, buffer, 'application/pdf')
    }
}

export const pdfService = new PdfService()
