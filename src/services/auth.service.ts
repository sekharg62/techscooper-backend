import jwt, { type SignOptions } from 'jsonwebtoken'

import { env } from '../config/env.js'
import { HttpStatus } from '../constants/httpStatus.js'
import { prisma } from '../db/prisma.js'
import type { UserRole } from '../generated/prisma/index.js'
import { ApiError } from '../utils/ApiError.js'

export interface AuthCredentials {
  name?: unknown
  email?: unknown
}

export interface SafeUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

function requireNonEmptyString(
  value: unknown,
  label: string,
): string {
  if (typeof value !== 'string') {
    throw new ApiError(HttpStatus.BAD_REQUEST, `${label} must be a string`)
  }
  const s = value.trim()
  if (!s) {
    throw new ApiError(HttpStatus.BAD_REQUEST, `${label} cannot be empty`)
  }
  return s
}

function parseCredentials(body: AuthCredentials): {
  name: string
  email: string
} {
  const name = requireNonEmptyString(body.name, 'Name')
  const emailRaw = requireNonEmptyString(body.email, 'Email')
  const email = emailRaw.toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid email format')
  }
  return { name, email }
}

function ensureJwtConfigured(): string {
  if (env.JWT_SECRET) return env.JWT_SECRET
  if (env.NODE_ENV !== 'production') {
    return 'development-only-jwt-secret-min-32-characters!'
  }
  throw new ApiError(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'JWT_SECRET is required in production',
  )
}

export function signAuthToken(userId: string, email: string): string {
  const secret = ensureJwtConfigured()
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  }
  return jwt.sign({ sub: userId, email }, secret, options)
}

export async function registerUser(body: AuthCredentials): Promise<{
  token: string
  user: SafeUser
}> {
  const { name, email } = parseCredentials(body)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing !== null) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'An account with this email already exists',
    )
  }

  const user = await prisma.user.create({
    data: { name, email },
    select: { id: true, email: true, name: true, role: true },
  })

  return {
    token: signAuthToken(user.id, user.email),
    user,
  }
}

export async function loginUser(body: AuthCredentials): Promise<{
  token: string
  user: SafeUser
}> {
  const { name, email } = parseCredentials(body)

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  })

  if (user === null) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or name')
  }

  const storedName = user.name?.trim() ?? ''
  if (storedName !== name) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or name')
  }

  return {
    token: signAuthToken(user.id, user.email),
    user,
  }
}
