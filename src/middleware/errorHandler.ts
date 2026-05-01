import type { NextFunction, Request, Response } from 'express'

import { HttpStatus } from '../constants/httpStatus.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
    })
    return
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Unknown error'

  if (env.NODE_ENV !== 'production') console.error(err)

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: message })
}
