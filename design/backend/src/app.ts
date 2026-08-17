import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import healthRoutes from './routes/health.routes.js'
import formsRoutes from './routes/forms.routes.js'
import submissionsRoutes from './routes/submissions.routes.js'
import websiteRoutes from './routes/website.routes.js'
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
  app.use(express.json({ limit: '4mb' }))
  app.use('/api/v1', healthRoutes)
  app.use('/api/v1', formsRoutes)
  app.use('/api/v1', submissionsRoutes)
  app.use('/api/v1', websiteRoutes)

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
