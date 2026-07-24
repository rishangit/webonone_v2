import { Router } from 'express'
import type { z } from 'zod'
import {
  productsController,
  servicesController,
  spacesController,
} from '../controllers/catalog.controller.js'
import { requireAuth, requireCompanyAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createCatalogBodySchema, updateCatalogBodySchema } from '../schemas/catalog.schema.js'
import { createServiceBodySchema, updateServiceBodySchema } from '../schemas/services.schema.js'

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
router.use(catalogRoutes('products', productsController))
router.use(
  catalogRoutes('services', servicesController, {
    create: createServiceBodySchema,
    update: updateServiceBodySchema,
  }),
)
router.use(catalogRoutes('spaces', spacesController))

export default router
