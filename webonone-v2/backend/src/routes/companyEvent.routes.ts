import { Router } from 'express'
import * as companyEventController from '../controllers/companyEvent.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCompanySession } from '../middleware/requireCompanySession.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createCompanyEventBodySchema,
  createSessionTokenBodySchema,
  changeSessionScheduleBodySchema,
  reassignSessionStaffBodySchema,
  updateCompanyEventBodySchema,
} from '../schemas/companyEventSchemas.js'
import { requireCompanyAdminSession } from '../middleware/requireCompanyAdminSession.js'

const router = Router()

router.get('/me/events', requireAuth, companyEventController.listMyEvents)
router.get('/me/events/:id', requireAuth, companyEventController.getMyEvent)
router.get(
  '/me/events/:eventId/sessions/:occurrenceDate',
  requireAuth,
  companyEventController.getMySession,
)
router.get(
  '/me/events/:eventId/sessions/:occurrenceDate/check-ins',
  requireAuth,
  companyEventController.listMySessionCheckIns,
)
router.post(
  '/me/events/:eventId/sessions/:occurrenceDate/check-ins',
  requireAuth,
  companyEventController.createMySessionCheckIn,
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
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/cancel',
  requireCompanyAdminSession,
  companyEventController.cancelSession,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/reassign',
  requireCompanyAdminSession,
  validateBody(reassignSessionStaffBodySchema),
  companyEventController.reassignSessionStaff,
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
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/tokens/:tokenId/workflow/complete',
  requireCompanySession,
  companyEventController.completeSessionTokenWorkflow,
)
router.get(
  '/company/events/:eventId/sessions/:occurrenceDate/check-ins',
  requireCompanySession,
  companyEventController.listSessionCheckIns,
)
router.post(
  '/company/events/:eventId/sessions/:occurrenceDate/check-ins',
  requireCompanySession,
  companyEventController.createSessionCheckIn,
)

export default router
