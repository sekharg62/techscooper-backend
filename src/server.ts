import { createServer } from 'node:http'

import app from './app.js'
import { env } from './config/env.js'
import { connectMongo } from './db/mongo.js'

const server = createServer(app)

async function start(): Promise<void> {
  await connectMongo()

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${String(env.PORT)}`)
  })
}

void start().catch((error) => {
  console.error('Server failed to start:', error)
  process.exit(1)
})
