import { Router } from 'express'
import type { z } from 'zod'
import {
  productsController,
  servicesController,
  spacesController,
} from '../controllers/catalog.controller.js'
import { productVariantsController } from '../controllers/productVariants.controller.js'
import { serviceSpacesController } from '../controllers/serviceSpaces.controller.js'
import { stocksController } from '../controllers/stocks.controller.js'
import {
  requireAuth,
  requireCompanyAdmin,
  requireCompanyAdminOrSuperAdmin,
  requireSuperAdmin,
} from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  catalogAttributeValueBodySchema,
  createCatalogBodySchema,
  replaceCatalogAttributesBodySchema,
  replaceServiceSpacesBodySchema,
  updateCatalogBodySchema,
  updateCatalogGalleryBodySchema,
} from '../schemas/catalog.schema.js'
import { createProductVariantBodySchema } from '../schemas/productVariants.schema.js'
import { createServiceBodySchema, updateServiceBodySchema } from '../schemas/services.schema.js'
import { createStockBodySchema } from '../schemas/stocks.schema.js'

function catalogRoutes(
  path: string,
  controller: ReturnType<typeof import('../controllers/catalog.controller.js').createCatalogController>,
  schemas: {
    create: z.ZodType
    update: z.ZodType
  } = {
    create: createCatalogBodySchema,
    update: updateCatalogBodySchema,
  },
) {
  const router = Router()
  router.get(`/${path}`, requireAuth, controller.list)
  router.get(`/${path}/:id`, requireAuth, controller.get)
  router.post(
    `/${path}`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(schemas.create),
    controller.create,
  )
  router.put(
    `/${path}/:id`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(schemas.create),
    controller.update,
  )
  router.patch(
    `/${path}/:id/gallery`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(updateCatalogGalleryBodySchema),
    controller.updateGallery,
  )
  router.put(
    `/${path}/:id/attributes`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(replaceCatalogAttributesBodySchema),
    controller.replaceAttributes,
  )
  router.post(
    `/${path}/:id/attributes/:attributeId/values`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(catalogAttributeValueBodySchema),
    controller.addAttributeValue,
  )
  router.patch(
    `/${path}/:id/attribute-values/:valueId`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(catalogAttributeValueBodySchema),
    controller.updateAttributeValue,
  )
  router.delete(
    `/${path}/:id/attribute-values/:valueId`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    controller.deleteAttributeValue,
  )
  router.patch(
    `/${path}/:id/attribute-values/:valueId/default`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    controller.setAttributeValueDefault,
  )
  router.patch(
    `/${path}/:id`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(schemas.update),
    controller.update,
  )
  router.delete(`/${path}/:id`, requireAuth, requireSuperAdmin, controller.remove)
  return router
}

const router = Router()

router.get(
  '/products/:id/variants',
  requireAuth,
  productVariantsController.list,
)
router.get(
  '/products/:id/variants/:variantId',
  requireAuth,
  productVariantsController.get,
)
router.post(
  '/products/:id/variants',
  requireAuth,
  requireCompanyAdminOrSuperAdmin,
  validateBody(createProductVariantBodySchema),
  productVariantsController.create,
)

router.get(
  '/products/:id/variants/:variantId/stocks',
  requireAuth,
  stocksController.list,
)
router.post(
  '/products/:id/variants/:variantId/stocks',
  requireAuth,
  requireCompanyAdmin,
  validateBody(createStockBodySchema),
  stocksController.create,
)
router.patch(
  '/products/:id/variants/:variantId/stocks/:stockId/active',
  requireAuth,
  requireCompanyAdmin,
  stocksController.setActive,
)

router.get('/services/:id/spaces', requireAuth, serviceSpacesController.list)
router.put(
  '/services/:id/spaces',
  requireAuth,
  requireCompanyAdminOrSuperAdmin,
  validateBody(replaceServiceSpacesBodySchema),
  serviceSpacesController.replace,
)

router.use(catalogRoutes('products', productsController))
router.use(
  catalogRoutes('services', servicesController, {
    create: createServiceBodySchema,
    update: updateServiceBodySchema,
  }),
)
router.use(catalogRoutes('spaces', spacesController))

export default router
