import type { Request, Response } from 'express'

import { HttpStatus } from '../constants/httpStatus.js'

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(HttpStatus.NOT_FOUND).json({ error: 'Not found' })
}
