import { Router } from 'express'
import * as feedbackController from '../controllers/feedback.controller.js'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { requireFeedbackAutomationOrJwt } from '../middleware/feedbackAutomationAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createFeedbackBodySchema,
  createFeedbackCommentBodySchema,
  updateFeedbackBodySchema,
  updateFeedbackStatusBodySchema,
} from '../schemas/feedbackSchemas.js'

const router = Router()

router.get('/feedback', requireFeedbackAutomationOrJwt, feedbackController.listFeedback)
router.get(
  '/feedback/ticket/:ticketNumber',
  requireFeedbackAutomationOrJwt,
  feedbackController.getFeedbackByTicket,
)
router.get(
  '/feedback/ticket/:ticketNumber/spec-docs',
  requireAuth,
  feedbackController.listFeedbackSpecDocs,
)
router.get(
  '/feedback/ticket/:ticketNumber/spec-docs/:fileName',
  requireAuth,
  feedbackController.getFeedbackSpecDoc,
)
router.get('/feedback/:id', requireFeedbackAutomationOrJwt, feedbackController.getFeedback)
router.get('/feedback/:id/comments', requireAuth, feedbackController.listFeedbackComments)
router.post(
  '/feedback/:id/comments',
  requireAuth,
  validateBody(createFeedbackCommentBodySchema),
  feedbackController.createFeedbackComment,
)
router.post('/feedback/:id/viewed', requireAuth, feedbackController.markFeedbackViewed)
router.patch(
  '/feedback/:id',
  requireAuth,
  validateBody(updateFeedbackBodySchema),
  feedbackController.updateFeedback,
)
router.post(
  '/feedback',
  requireAuth,
  validateBody(createFeedbackBodySchema),
  feedbackController.createFeedback,
)
router.patch(
  '/feedback/:id/status',
  requireFeedbackAutomationOrJwt,
  requireSuperAdmin,
  validateBody(updateFeedbackStatusBodySchema),
  feedbackController.updateFeedbackStatus,
)

export default router
