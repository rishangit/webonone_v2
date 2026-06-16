import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.routes.js'
import healthRoutes from './routes/health.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json())

  app.use('/api/v1', healthRoutes)
  app.use('/api/v1/auth', authRoutes)

  app.use(errorHandler)

  return app
}
