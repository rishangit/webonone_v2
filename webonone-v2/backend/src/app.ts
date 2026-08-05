import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import healthRoutes from './routes/health.routes.js'
import preferencesRoutes from './routes/preferences.routes.js'
import companyRoutes from './routes/company.routes.js'
import companyCatalogRoutes from './routes/companyCatalog.routes.js'
import companyStaffRoutes from './routes/companyStaff.routes.js'
import companyEventRoutes from './routes/companyEvent.routes.js'
import siteMediaRefsRoutes from './routes/siteMediaRefs.routes.js'
import themesRoutes from './routes/themes.routes.js'
import publicCatalogSearchRoutes from './routes/publicCatalogSearch.routes.js'
import userActivityRoutes from './routes/userActivity.routes.js'
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
  app.use('/api/v1', siteMediaRefsRoutes)
  app.use('/api/v1', themesRoutes)
  app.use('/api/v1', preferencesRoutes)
  app.use('/api/v1', publicCatalogSearchRoutes)
  app.use('/api/v1', userActivityRoutes)
  app.use('/api/v1', companyCatalogRoutes)
  app.use('/api/v1', companyStaffRoutes)
  app.use('/api/v1', companyEventRoutes)
  app.use('/api/v1', companyRoutes)

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
