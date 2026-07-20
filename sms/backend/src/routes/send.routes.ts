import { Router } from 'express'
import * as sendController from '../controllers/send.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  otpSendBodySchema,
  otpVerifyBodySchema,
  sendSmsBodySchema,
  sendTestSmsBodySchema,
} from '../schemas/send.schema.js'

const router = Router()

router.post(
  '/send',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(sendSmsBodySchema),
  sendController.sendSms,
)
router.post(
  '/send/test',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(sendTestSmsBodySchema),
  sendController.sendTestSms,
)
router.post(
  '/otp/send',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(otpSendBodySchema),
  sendController.otpSend,
)
router.post(
  '/otp/verify',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(otpVerifyBodySchema),
  sendController.otpVerify,
)

export default router
