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

/** Upcoming Specific-time sessions for a marketplace service. */
router.get(
  '/internal/catalog/services/:id/sessions',
  requireInternalAuth,
  publicCatalogSearchController.listServiceSessions,
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
