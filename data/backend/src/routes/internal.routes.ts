import { Router } from 'express'
import {
  productsController,
  servicesController,
  spacesController,
} from '../controllers/catalog.controller.js'
import { internalProductVariantsController } from '../controllers/internalProductVariants.controller.js'
import * as tagsController from '../controllers/tags.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

/** Service-key read APIs for platform backends (e.g. WebOnOne public catalog search). */
router.get('/internal/tags', requireInternalAuth, tagsController.listTags)
router.get('/internal/products', requireInternalAuth, productsController.list)
router.get('/internal/services', requireInternalAuth, servicesController.list)
router.get('/internal/spaces', requireInternalAuth, spacesController.list)
router.get(
  '/internal/products/:id/variants',
  requireInternalAuth,
  internalProductVariantsController.list,
)
router.get(
  '/internal/products/:id/variants/:variantId',
  requireInternalAuth,
  internalProductVariantsController.get,
)

export default router
