import { Request, Response, NextFunction } from 'express'
import { validatePublicToken } from '../src/common/middleware/token-validator.js'

describe('Token Validator', () => {
    it('returns an error lacking token', async () => {
        const req = { params: {} } as Request
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response
        const next = jest.fn() as NextFunction

        await validatePublicToken(req, res, next)
        expect(res.status).toHaveBeenCalledWith(400)
    })
})
