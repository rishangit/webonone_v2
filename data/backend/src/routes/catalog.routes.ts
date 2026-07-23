import { Router } from 'express'
import {
  productsController,
  servicesController,
  spacesController,
} from '../controllers/catalog.controller.js'
import { requireAuth, requireCompanyAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createCatalogBodySchema, updateCatalogBodySchema } from '../schemas/catalog.schema.js'

function catalogRoutes(
  path: string,
  controller: ReturnType<typeof import('../controllers/catalog.controller.js').createCatalogController>,
) {
  const router = Router()
  router.get(`/${path}`, requireAuth, controller.list)
  router.get(`/${path}/:id`, requireAuth, controller.get)
  router.post(
    `/${path}`,
    requireAuth,
    requireCompanyAdminOrSuperAdmin,
    validateBody(createCatalogBodySchema),
    controller.create,
  )
  router.put(`/${path}/:id`, requireAuth, requireSuperAdmin, validateBody(createCatalogBodySchema), controller.update)
  router.patch(`/${path}/:id`, requireAuth, requireSuperAdmin, validateBody(updateCatalogBodySchema), controller.update)
  router.delete(`/${path}/:id`, requireAuth, requireSuperAdmin, controller.remove)
  return router
}

const router = Router()
router.use(catalogRoutes('products', productsController))
router.use(catalogRoutes('services', servicesController))
router.use(catalogRoutes('spaces', spacesController))

export default router
