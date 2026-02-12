import { Request, Response } from 'express'
import { EmailLog } from '../../database/models/index.js'
import path from 'path'

export class EmailTrackingController {
    /**
     * Serve a 1x1 transparent pixel and log the open
     */
    async trackOpen(req: Request, res: Response) {
        const { id } = req.query

        // Return the pixel immediately (async logging)
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        )
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        })
        res.end(pixel)

        // Log the open event
        if (id && typeof id === 'string') {
            try {
                // Update status to OPENED if it was SENT
                // Or define a new status logic (e.g. separate 'openedAt' field)
                // For now, let's update `openedAt` in metadata/field
                // Since EmailLog doesn't have `openedAt` explicitly in Schema I saw earlier,
                // I'll check the schema again. 
                // Wait, Schema has `status`, `sentAt`, `metadata`. 
                // I should add `openedAt` to schema or store in metadata.
                // I'll store in metadata for now to avoid schema migration during this task, 
                // or just update metadata.

                await EmailLog.findByIdAndUpdate(id, {
                    $set: {
                        'metadata.openedAt': new Date(),
                        'metadata.isOpened': true
                    }
                })
                console.log(`[Email Tracking] Email ${id} opened`)

            } catch (err) {
                console.error(`[Email Tracking] Error logging open for ${id}:`, err)
            }
        }
    }
}

export const emailTrackingController = new EmailTrackingController()
