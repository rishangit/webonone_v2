import { Router } from 'express'
import * as companyCatalogController from '../controllers/companyCatalog.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import { bookPublicSessionTokenBodySchema } from '../schemas/companyEventSchemas.js'
import {
  forkCatalogBodySchema,
  fromLibraryBodySchema,
  linkCatalogBodySchema,
  updateCatalogGalleryBodySchema,
  updateCatalogPricingBodySchema,
  updateServiceFormBodySchema,
} from '../schemas/companyCatalogSchemas.js'

const router = Router()

router.get(
  '/company/me/catalog/services/with-form',
  requireCompanySession,
  companyCatalogController.listServicesWithForm,
)

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
  '/company/me/catalog/:kind/:id/pricing',
  requireCompanyAdminSession,
  validateBody(updateCatalogPricingBodySchema),
  companyCatalogController.updateCatalogPricing,
)
router.patch(
  '/company/me/catalog/services/:id/form',
  requireCompanyAdminSession,
  validateBody(updateServiceFormBodySchema),
  companyCatalogController.updateServiceForm,
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

// Membership-scoped browse (Settings → My Companies) — after /me/catalog so "me" is not a companyId
router.get(
  '/company/:companyId/catalog/services/:id/sessions',
  requireAuth,
  companyCatalogController.listServiceSessionsForCompany,
)
router.get(
  '/company/:companyId/catalog/services/:id/sessions/:eventId/:occurrenceDate/tokens/next',
  requireAuth,
  companyCatalogController.getNextTokenForCompany,
)
router.get(
  '/company/:companyId/catalog/services/:id/sessions/:eventId/:occurrenceDate/tokens/mine',
  requireAuth,
  companyCatalogController.getMyTokenForCompany,
)
router.post(
  '/company/:companyId/catalog/services/:id/sessions/:eventId/:occurrenceDate/tokens',
  requireAuth,
  validateBody(bookPublicSessionTokenBodySchema),
  companyCatalogController.bookTokenForCompany,
)
router.get(
  '/company/:companyId/catalog/:kind',
  requireAuth,
  companyCatalogController.listCatalogForCompany,
)
router.get(
  '/company/:companyId/catalog/:kind/:id',
  requireAuth,
  companyCatalogController.getCatalogForCompany,
)

export default router
