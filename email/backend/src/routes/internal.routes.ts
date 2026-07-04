import { Router } from 'express'
import * as internalController from '../controllers/internal.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { internalSendBodySchema } from '../schemas/internal.schema.js'

const router = Router()

router.post('/internal/send', requireInternalAuth, validateBody(internalSendBodySchema), internalController.internalSend)

export default router
