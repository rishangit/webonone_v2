import { Router } from 'express'
import { dataAiCapabilities } from '../ai/capabilities.js'
import { AI_CAPABILITY_VERSION } from '../ai/capabilityTypes.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

router.get('/internal/ai/capabilities', requireInternalAuth, (_req, res) => {
  res.json({
    service: 'data',
    capabilityVersion: AI_CAPABILITY_VERSION,
    tools: dataAiCapabilities,
  })
})

export default router
