import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { createHealthRoutes } from './routes/health.routes.js'
import { createConversationRoutes } from './routes/conversations.routes.js'
import { createAiSettingsRoutes } from './routes/aiSettings.routes.js'
import type { ConversationService } from './services/conversation.service.js'
import type { AiSettingsService } from './services/aiSettings.service.js'
import type { RateLimiter } from './middleware/rateLimit.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const iisHosted = process.env.IIS_NODE_HOSTED === '1'
const siteRoot = iisHosted
  ? path.resolve(moduleDir, '..')
  : path.resolve(moduleDir, '../..')
const publicDir = path.join(siteRoot, 'public')

export type CreateAppOptions = {
  conversationService: ConversationService
  aiSettingsService: AiSettingsService
  rateLimiter: RateLimiter
}

export function createApp(options: CreateAppOptions) {
  const app = express()
  const allowed = new Set(env.allowedOrigins)

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowed.has(origin.replace(/\/$/, ''))) {
          callback(null, true)
          return
        }
        callback(null, false)
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use('/api/v1', createHealthRoutes(options.rateLimiter))
  app.use('/api/v1', createConversationRoutes(options.conversationService, options.rateLimiter))
  app.use('/api/v1', createAiSettingsRoutes(options.aiSettingsService))

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
