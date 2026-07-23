import { Router } from 'express'
import * as internalController from '../controllers/internal.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  internalOtpSendBodySchema,
  internalOtpVerifyBodySchema,
  internalSendBodySchema,
} from '../schemas/internal.schema.js'

const router = Router()

router.post('/internal/send', requireInternalAuth, validateBody(internalSendBodySchema), internalController.internalSend)
router.post(
  '/internal/otp/send',
  requireInternalAuth,
  validateBody(internalOtpSendBodySchema),
  internalController.internalOtpSend,
)
router.post(
  '/internal/otp/verify',
  requireInternalAuth,
  validateBody(internalOtpVerifyBodySchema),
  internalController.internalOtpVerify,
)

router.get(
  '/internal/companies/:companyId/gateway-status',
  requireInternalAuth,
  internalController.internalGatewayStatus,
)

router.post(
  '/internal/companies/:companyId/templates/ensure-welcome',
  requireInternalAuth,
  internalController.internalEnsureWelcome,
)

export default router
