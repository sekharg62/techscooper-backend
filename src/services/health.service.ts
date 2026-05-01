import { env } from '../config/env.js'

export async function getHealthPayload(): Promise<{
  status: string
  env: string
}> {
  return {
    status: 'ok',
    env: env.NODE_ENV,
  }
}
