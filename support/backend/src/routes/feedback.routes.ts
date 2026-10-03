import { Router } from 'express'
import * as feedbackController from '../controllers/feedback.controller.js'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createFeedbackBodySchema,
  createFeedbackCommentBodySchema,
  updateFeedbackBodySchema,
  updateFeedbackStatusBodySchema,
} from '../schemas/feedbackSchemas.js'

const router = Router()

router.get('/feedback', requireAuth, feedbackController.listFeedback)
router.get('/feedback/ticket/:ticketNumber', requireAuth, feedbackController.getFeedbackByTicket)
router.get('/feedback/:id', requireAuth, feedbackController.getFeedback)
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
  requireAuth,
  requireSuperAdmin,
  validateBody(updateFeedbackStatusBodySchema),
  feedbackController.updateFeedbackStatus,
)

export default router
