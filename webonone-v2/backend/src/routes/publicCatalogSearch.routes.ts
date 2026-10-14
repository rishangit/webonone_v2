import { Router } from 'express'
import * as publicCatalogSearchController from '../controllers/publicCatalogSearch.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { bookPublicSessionTokenBodySchema } from '../schemas/companyEventSchemas.js'

const router = Router()

/** Service-key marketplace search for website BFF (and other backends). */
router.get(
  '/internal/catalog/search',
  requireInternalAuth,
  publicCatalogSearchController.searchCatalog,
)

/** Closest companies and their sellable items for the public website home. */
router.get(
  '/internal/catalog/nearby',
  requireInternalAuth,
  publicCatalogSearchController.listNearbyCatalog,
)

/** Upcoming Specific-time sessions for a marketplace service. */
router.get(
  '/internal/catalog/services/:id/sessions',
  requireInternalAuth,
  publicCatalogSearchController.listServiceSessions,
)

/** Public catalog reviews for website BFF (company-owned rows in webonone_v2). */
router.get(
  '/internal/catalog/:kind/:id/reviews',
  requireInternalAuth,
  publicCatalogSearchController.listCatalogReviews,
)

/** Product variant, stock, and price for public website detail (BFF). */
router.get(
  '/internal/catalog/products/:id/variant-offer',
  requireInternalAuth,
  publicCatalogSearchController.getProductVariantOffer,
)

/** Service-key marketplace detail for website BFF. */
router.get(
  '/internal/catalog/:kind/:id',
  requireInternalAuth,
  publicCatalogSearchController.getCatalogItem,
)

/** Self-serve: next queue number for a session (logged-in website user). */
router.get(
  '/public/catalog/services/:serviceId/sessions/:eventId/:occurrenceDate/tokens/next',
  requireAuth,
  publicCatalogSearchController.getNextPublicToken,
)

/** Self-serve: caller's existing token for a session. */
router.get(
  '/public/catalog/services/:serviceId/sessions/:eventId/:occurrenceDate/tokens/mine',
  requireAuth,
  publicCatalogSearchController.getMyPublicToken,
)

/** Self-serve: book the next token for the logged-in user. */
router.post(
  '/public/catalog/services/:serviceId/sessions/:eventId/:occurrenceDate/tokens',
  requireAuth,
  validateBody(bookPublicSessionTokenBodySchema),
  publicCatalogSearchController.bookPublicToken,
)

export default router
