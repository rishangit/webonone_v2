import { Router } from 'express'
import * as feedbackController from '../controllers/feedback.controller.js'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createFeedbackBodySchema,
  updateFeedbackStatusBodySchema,
} from '../schemas/feedbackSchemas.js'

const router = Router()

router.get('/feedback', requireAuth, feedbackController.listFeedback)
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
