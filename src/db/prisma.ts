import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/index.js'
import { env } from '../config/env.js'

/** Prisma Client with the `pg` driver (Prisma ORM v7 — requires `@prisma/adapter-pg`). */
function createPrismaClient(): PrismaClient {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL.',
    )
  }

  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = createPrismaClient()
