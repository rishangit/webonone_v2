import { Router } from 'express'
import * as companyEventController from '../controllers/companyEvent.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createCompanyEventBodySchema,
  createSessionTokenBodySchema,
  changeSessionScheduleBodySchema,
  updateCompanyEventBodySchema,
} from '../schemas/companyEventSchemas.js'

const router = Router()

router.get('/me/events', requireAuth, companyEventController.listMyEvents)
router.get('/me/events/:id', requireAuth, companyEventController.getMyEvent)
router.get(
  '/me/events/:eventId/sessions/:occurrenceDate',
  requireAuth,
  companyEventController.getMySession,
)

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
  '/company/events/:eventId/sessions/:occurrenceDate',
  requireCompanySession,
  companyEventController.getSession,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/start',
  requireCompanySession,
  companyEventController.startSession,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/call-next',
  requireCompanySession,
  companyEventController.callNextSessionToken,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/call-previous',
  requireCompanySession,
  companyEventController.callPreviousSessionToken,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/end',
  requireCompanySession,
  companyEventController.endSession,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/change',
  requireCompanySession,
  validateBody(changeSessionScheduleBodySchema),
  companyEventController.changeSessionSchedule,
)
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
