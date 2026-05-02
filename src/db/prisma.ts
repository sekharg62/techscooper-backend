import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { PrismaClient } from '../generated/prisma/index.js'
import { env } from '../config/env.js'

/** Prisma Client with the `pg` driver (Prisma ORM v7 — requires `@prisma/adapter-pg`). */
function createPrismaClient(): PrismaClient {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL.',
    )
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 10_000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = createPrismaClient()
