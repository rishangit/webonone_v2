import cors from 'cors'
import express from 'express'
import healthRoutes from './routes/health.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json())
  app.use('/api/v1', healthRoutes)

  return app
}
