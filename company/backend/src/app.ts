import cors from 'cors'
import express from 'express'
import companyRoutes from './routes/company.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json())
  app.use('/api/v1', companyRoutes)
  app.use(errorHandler)

  return app
}
