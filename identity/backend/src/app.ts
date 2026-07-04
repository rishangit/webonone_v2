import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.routes.js'
import healthRoutes from './routes/health.routes.js'
import rolesRoutes from './routes/roles.routes.js'
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
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1', rolesRoutes)

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
