import { Router } from 'express'
import * as internalDatasetController from '../controllers/internalDataset.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

router.post(
  '/internal/companies/:companyId/dataset-query',
  requireInternalAuth,
  internalDatasetController.queryCompanyDatasetInternal,
)

export default router
