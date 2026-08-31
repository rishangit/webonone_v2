import { Router } from 'express'
import {
  productsController,
  servicesController,
  spacesController,
} from '../controllers/catalog.controller.js'
import { internalProductVariantsController } from '../controllers/internalProductVariants.controller.js'
import { internalStocksController } from '../controllers/internalStocks.controller.js'
import * as tagsController from '../controllers/tags.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { consumeStockBodySchema } from '../schemas/stocks.schema.js'

const router = Router()

/** Service-key read APIs for platform backends (e.g. WebOnOne public catalog search). */
router.get('/internal/tags', requireInternalAuth, tagsController.listTags)
router.get('/internal/products', requireInternalAuth, productsController.list)
router.get('/internal/services', requireInternalAuth, servicesController.list)
router.get('/internal/spaces', requireInternalAuth, spacesController.list)
router.get(
  '/internal/products/:id/variants/:variantId',
  requireInternalAuth,
  internalProductVariantsController.get,
)
router.post(
  '/internal/products/:id/variants/:variantId/stocks/:stockId/consume',
  requireInternalAuth,
  validateBody(consumeStockBodySchema),
  internalStocksController.consume,
)

export default router
