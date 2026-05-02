import cors from 'cors'
import express from 'express'

import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFound.js'
import { apiRouter } from './routes/index.js'

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
)

app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
