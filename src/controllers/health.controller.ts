import type { Request, Response } from 'express'

import { HttpStatus } from '../constants/httpStatus.js'
import { getHealthPayload } from '../services/health.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const body = await getHealthPayload()
  res.status(HttpStatus.OK).json(body)
})
