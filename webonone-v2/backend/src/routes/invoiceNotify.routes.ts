import { Router } from 'express'
import * as internalInvoiceNotifyController from '../controllers/internalInvoiceNotify.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

router.post(
  '/internal/invoices/issued',
  requireInternalAuth,
  internalInvoiceNotifyController.notifyInvoiceIssued,
)

export default router
