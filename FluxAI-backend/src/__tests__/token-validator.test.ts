import { Request, Response, NextFunction } from 'express'
import { validatePublicToken } from '../../src/common/middleware/token-validator'
import { Offer } from '../../src/database/models/index'
import crypto from 'crypto'

jest.mock('../../src/database/models/index', () => ({
    Offer: {
        findOne: jest.fn()
    }
}))

describe('Public Token Validation Middleware', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = { params: {} }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    it('should return 400 if token is missing', async () => {
        await validatePublicToken(req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token is required' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 404 for invalid tokens', async () => {
        req.params = { token: 'invalid_raw_token' };
        (Offer.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        })

        await validatePublicToken(req as Request, res as Response, next)

        expect(Offer.findOne).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid offer token' })
    })

    it('should return 410 if token is expired', async () => {
        req.params = { token: 'expired_raw_token' }
        const pastDate = new Date(Date.now() - 10000)

            ; (Offer.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue({ tokenExpiresAt: pastDate })
            })

        await validatePublicToken(req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(410)
        expect(res.json).toHaveBeenCalledWith({ success: false, error: '410 Gone: Token has expired' })
    })

    it('should return 410 if token is already used', async () => {
        req.params = { token: 'used_raw_token' }

            ; (Offer.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue({ tokenUsedAt: new Date() })
            })

        await validatePublicToken(req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(410)
        expect(res.json).toHaveBeenCalledWith({ success: false, error: '410 Gone: Token has already been consumed' })
    })

    it('should call next() if token is perfectly valid', async () => {
        req.params = { token: 'valid_token' }
        const futureDate = new Date(Date.now() + 10000)

            ; (Offer.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue({ tokenExpiresAt: futureDate, tokenUsedAt: null })
            })

        await validatePublicToken(req as Request, res as Response, next)

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })
})
