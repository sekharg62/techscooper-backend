import type { Request, Response } from 'express'

import { HttpStatus } from '../constants/httpStatus.js'
import { loginUser, registerUser } from '../services/auth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body)
  res.status(HttpStatus.CREATED).json(result)
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body)
  res.status(HttpStatus.OK).json(result)
})
