import { Router } from 'express'
import * as internalController from '../controllers/internal.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

router.post('/internal/companies/upsert', requireInternalAuth, internalController.upsertCompanyHandler)
router.post('/internal/companies/purge-orphans', requireInternalAuth, internalController.purgeOrphanCompaniesHandler)
router.post('/internal/invoices/generate', requireInternalAuth, internalController.generateInvoicesHandler)

export default router
