import { Router } from 'express'
import * as companyEventController from '../controllers/companyEvent.controller.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createCompanyEventBodySchema,
  createSessionTokenBodySchema,
  updateCompanyEventBodySchema,
} from '../schemas/companyEventSchemas.js'

const router = Router()

router.get('/company/events', requireCompanySession, companyEventController.listEvents)
router.post(
  '/company/events',
  requireCompanySession,
  validateBody(createCompanyEventBodySchema),
  companyEventController.createEvent,
)
router.get('/company/events/:id', requireCompanySession, companyEventController.getEvent)
router.patch(
  '/company/events/:id',
  requireCompanySession,
  validateBody(updateCompanyEventBodySchema),
  companyEventController.updateEvent,
)
router.delete('/company/events/:id', requireCompanySession, companyEventController.deleteEvent)

router.get(
  '/company/events/:eventId/sessions/:occurrenceDate/tokens',
  requireCompanySession,
  companyEventController.listSessionTokens,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/tokens',
  requireCompanySession,
  validateBody(createSessionTokenBodySchema),
  companyEventController.createSessionToken,
)

export default router
