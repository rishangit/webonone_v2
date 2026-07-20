import { Router } from 'express'
import * as devicesController from '../controllers/devices.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/devices', requireAuth, requireRole('super_admin', 'company_admin'), devicesController.getDevices)
router.post(
  '/devices/:id/approve',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  devicesController.approveDevice,
)
router.post(
  '/devices/:id/revoke',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  devicesController.revokeDevice,
)

export default router
