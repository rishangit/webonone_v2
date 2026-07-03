import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import healthRoutes from './routes/health.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import tagsRoutes from './routes/tags.routes.js'
import unitsRoutes from './routes/units.routes.js'
import attributesRoutes from './routes/attributes.routes.js'
import catalogRoutes from './routes/catalog.routes.js'
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
  app.use('/api/v1', dashboardRoutes)
  app.use('/api/v1', tagsRoutes)
  app.use('/api/v1', unitsRoutes)
  app.use('/api/v1', attributesRoutes)
  app.use('/api/v1', catalogRoutes)

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
