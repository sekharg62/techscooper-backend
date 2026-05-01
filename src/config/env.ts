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
} as const
