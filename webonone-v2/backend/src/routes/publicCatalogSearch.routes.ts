import { Router } from 'express'
import * as publicCatalogSearchController from '../controllers/publicCatalogSearch.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

/** Service-key marketplace search for website BFF (and other backends). */
router.get(
  '/internal/catalog/search',
  requireInternalAuth,
  publicCatalogSearchController.searchCatalog,
)

/** Service-key marketplace detail for website BFF. */
router.get(
  '/internal/catalog/:kind/:id',
  requireInternalAuth,
  publicCatalogSearchController.getCatalogItem,
)

export default router
