import type { NextFunction, Request, RequestHandler, Response } from 'express'

type AsyncReqHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | unknown>

/** Wrap async route handlers so rejections reach the centralized error middleware. */
export function asyncHandler(fn: AsyncReqHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next)
  }
}
