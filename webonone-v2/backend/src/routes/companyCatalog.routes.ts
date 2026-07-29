import { Router } from 'express'
import * as companyCatalogController from '../controllers/companyCatalog.controller.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  forkCatalogBodySchema,
  fromLibraryBodySchema,
  linkCatalogBodySchema,
  updateCatalogGalleryBodySchema,
} from '../schemas/companyCatalogSchemas.js'

const router = Router()

router.get(
  '/company/me/catalog/:kind',
  requireCompanySession,
  companyCatalogController.listCatalog,
)
router.post(
  '/company/me/catalog/:kind/link',
  requireCompanyAdminSession,
  validateBody(linkCatalogBodySchema),
  companyCatalogController.linkCatalog,
)
router.post(
  '/company/me/catalog/:kind/from-library',
  requireCompanyAdminSession,
  validateBody(fromLibraryBodySchema),
  companyCatalogController.fromLibraryCatalog,
)
router.post(
  '/company/me/catalog/:kind/custom',
  requireCompanyAdminSession,
  companyCatalogController.createCustomCatalog,
)
router.get(
  '/company/me/catalog/:kind/:id',
  requireCompanySession,
  companyCatalogController.getCatalog,
)
router.post(
  '/company/me/catalog/:kind/:id/fork',
  requireCompanyAdminSession,
  validateBody(forkCatalogBodySchema),
  companyCatalogController.forkCatalog,
)
router.patch(
  '/company/me/catalog/:kind/:id/gallery',
  requireCompanyAdminSession,
  validateBody(updateCatalogGalleryBodySchema),
  companyCatalogController.updateCatalogGallery,
)
router.patch(
  '/company/me/catalog/:kind/:id',
  requireCompanyAdminSession,
  companyCatalogController.updateCatalog,
)
router.delete(
  '/company/me/catalog/:kind/:id',
  requireCompanyAdminSession,
  companyCatalogController.deleteCatalog,
)

export default router
