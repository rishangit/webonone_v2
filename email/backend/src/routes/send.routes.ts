import { Router } from 'express'
import * as sendController from '../controllers/send.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { sendEmailBodySchema, sendTestEmailBodySchema } from '../schemas/send.schema.js'

const router = Router()

router.post(
  '/send',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(sendEmailBodySchema),
  sendController.sendEmail,
)
router.post(
  '/send/test',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(sendTestEmailBodySchema),
  sendController.sendTestEmail,
)

export default router
