import { Router } from 'express'
import * as deviceController from '../controllers/device.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireApprovedDevice, requireDevice } from '../middleware/deviceAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { deviceStatusBodySchema, heartbeatBodySchema, registerDeviceBodySchema } from '../schemas/device.schema.js'

const router = Router()

// Registration authenticates the operator via user JWT; scope is derived from role.
router.post('/device/register', requireAuth, validateBody(registerDeviceBodySchema), deviceController.register)

// All other device calls authenticate with the issued device key.
router.post('/device/heartbeat', requireDevice, validateBody(heartbeatBodySchema), deviceController.heartbeatHandler)
router.get('/device/messages', requireDevice, requireApprovedDevice, deviceController.getMessages)
router.post(
  '/device/messages/:id/status',
  requireDevice,
  requireApprovedDevice,
  validateBody(deviceStatusBodySchema),
  deviceController.postStatus,
)

export default router
