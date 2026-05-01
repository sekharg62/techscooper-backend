import { HttpStatusCode } from '../constants/httpStatus.js'

export class ApiError extends Error {
  readonly statusCode: HttpStatusCode
  readonly isOperational: boolean

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    isOperational = true,
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, ApiError.prototype)
    this.name = 'ApiError'
  }
}
