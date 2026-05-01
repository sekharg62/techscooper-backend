import { MongoClient } from 'mongodb'

import { env } from '../config/env.js'

/** Single shared client; created when `connectMongo()` succeeds. */
let client: MongoClient | null = null

/**
 * Connects to MongoDB Atlas (or any URI) using `MONGODB_URI`.
 * Safe to call with an empty env: logs and returns. On failure, logs and keeps the API running so PostgreSQL routes still work.
 */
export async function connectMongo(): Promise<void> {
  const uri = env.MONGODB_URI
  if (!uri) {
    console.log(
      '[mongo] MONGODB_URI not set — skipping MongoDB (PostgreSQL / Prisma unchanged).',
    )
    return
  }

  try {
    client = new MongoClient(uri)
    await client.connect()
    await client.db().admin().command({ ping: 1 })
    console.log('[mongo] Connected successfully to MongoDB Atlas.')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
    console.error('[mongo] Connection failed:', message)
    console.error(
      '[mongo] Fix MONGODB_URI in .env and restart. PostgreSQL APIs continue.',
    )
    if (client !== null) {
      try {
        await client.close()
      } catch {
        /* ignore close errors after failed connect */
      }
    }
    client = null
  }
}

export function getMongoClient(): MongoClient | null {
  return client
}

/** Returns a database handle; uses the default DB from the URI unless `name` is set. */
export function getMongoDb(name?: string): ReturnType<MongoClient['db']> | null {
  if (client === null) return null
  return client.db(name)
}
