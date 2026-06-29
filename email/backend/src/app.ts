import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import healthRoutes from './routes/health.routes.js'
import internalRoutes from './routes/internal.routes.js'
import templatesRoutes from './routes/templates.routes.js'
import historyRoutes from './routes/history.routes.js'
import queueRoutes from './routes/queue.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import sendRoutes from './routes/send.routes.js'
import brandingRoutes from './routes/branding.routes.js'
import providersRoutes from './routes/providers.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const iisHosted = process.env.IIS_NODE_HOSTED === '1'
const siteRoot = iisHosted
  ? path.resolve(moduleDir, '..')
  : path.resolve(moduleDir, '../..')
const publicDir = path.join(siteRoot, 'public')

export function createApp() {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json())
  app.use('/api/v1', healthRoutes)
  app.use('/api/v1', internalRoutes)
  app.use('/api/v1', templatesRoutes)
  app.use('/api/v1', historyRoutes)
  app.use('/api/v1', queueRoutes)
  app.use('/api/v1', dashboardRoutes)
  app.use('/api/v1', sendRoutes)
  app.use('/api/v1', brandingRoutes)
  app.use('/api/v1', providersRoutes)

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, { index: 'index.html' }))
    app.get(/^(?!\/api\/).*/, (_req, res, next) => {
      res.sendFile(path.join(publicDir, 'index.html'), (err) => {
        if (err) next(err)
      })
    })
  }

  app.use(errorHandler)

  return app
}
