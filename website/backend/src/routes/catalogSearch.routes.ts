import { Router } from 'express'
import * as catalogSearchController from '../controllers/catalogSearch.controller.js'

const router = Router()

/** Anonymous public catalog search (BFF → WebOnOne internal). */
router.get('/catalog/search', catalogSearchController.searchCatalog)

/** Upcoming Specific-time sessions for a marketplace service. */
router.get('/catalog/services/:id/sessions', catalogSearchController.listServiceSessions)

/** Self-serve token endpoints (forward user JWT to WebOnOne). */
router.get(
  '/catalog/services/:id/sessions/:eventId/:occurrenceDate/tokens/next',
  catalogSearchController.getNextSessionToken,
)
router.get(
  '/catalog/services/:id/sessions/:eventId/:occurrenceDate/tokens/mine',
  catalogSearchController.getMySessionToken,
)
router.post(
  '/catalog/services/:id/sessions/:eventId/:occurrenceDate/tokens',
  catalogSearchController.bookSessionToken,
)

/** Anonymous public catalog detail (BFF → WebOnOne internal). */
router.get('/catalog/:kind/:id', catalogSearchController.getCatalogItem)

export default router
