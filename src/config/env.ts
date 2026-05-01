import 'dotenv/config'

function optionalString(value: string | undefined, fallback: string): string {
  const v = value?.trim()
  return v !== undefined && v !== '' ? v : fallback
}

function optionalPort(value: string | undefined, fallback: number): number {
  const n = value !== undefined ? Number.parseInt(value, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const env = {
  NODE_ENV: optionalString(process.env.NODE_ENV, 'development'),
  PORT: optionalPort(process.env.PORT, 3001),
  CORS_ORIGIN: optionalString(
    process.env.CORS_ORIGIN,
    'http://localhost:5173',
  ),
  /** App / Prisma Client — often pooler URL on Supabase (port 6543). */
  DATABASE_URL: process.env.DATABASE_URL?.trim() ?? '',
  /**
   * Optional direct Postgres URL (e.g. Supabase `db.<project>.supabase.co:5432`) for
   * `prisma db push` / migrate via `prisma.config.ts`. App code still uses `DATABASE_URL`.
   */
  DIRECT_URL: process.env.DIRECT_URL?.trim() ?? '',
  /** JWT signing secret (required for auth). */
  JWT_SECRET: process.env.JWT_SECRET?.trim() ?? '',
  /** Passed to jsonwebtoken `expiresIn` (e.g. `7d`, `12h`). */
  JWT_EXPIRES_IN: optionalString(process.env.JWT_EXPIRES_IN, '7d'),
  /**
   * MongoDB connection string (e.g. MongoDB Atlas). Optional — if empty, Mongo is skipped.
   * Replace the demo URI with yours from Atlas → Connect → Drivers.
   */
  MONGODB_URI: process.env.MONGODB_URI?.trim() ?? '',
} as const
