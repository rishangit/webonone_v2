import { Router } from 'express'
import * as reviewsController from '../controllers/reviews.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createReviewBodySchema, updateReviewBodySchema } from '../schemas/reviews.schema.js'

const router = Router()

router.get('/reviews/public', reviewsController.listPublicReviews)
router.get('/reviews/me', requireAuth, reviewsController.getMyReview)
router.get('/reviews/summary', requireAuth, reviewsController.getReviewSummary)
router.post('/reviews', requireAuth, validateBody(createReviewBodySchema), reviewsController.createReview)
router.patch(
  '/reviews/:id',
  requireAuth,
  validateBody(updateReviewBodySchema),
  reviewsController.updateReview,
)

export default router
