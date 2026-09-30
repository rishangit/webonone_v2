import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateReviewBody, UpdateReviewBody } from '../schemas/reviews.schema.js'
import { reviewMeQuerySchema, reviewPublicListQuerySchema } from '../schemas/reviews.schema.js'
import * as reviewsService from '../services/reviews.service.js'
import { handleServiceError } from './controllerUtils.js'

export async function getMyReview(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  const parsed = reviewMeQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid query', code: 'VALIDATION' })
    return
  }

  const review = await reviewsService.getMyReview(
    userId,
    parsed.data.companyId,
    parsed.data.entityKind,
    parsed.data.entityId,
  )
  res.json({ review })
}

export async function listPublicReviews(req: AuthenticatedRequest, res: Response) {
  const parsed = reviewPublicListQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid query', code: 'VALIDATION' })
    return
  }

  const result = await reviewsService.listPublicReviews(
    parsed.data.companyId,
    parsed.data.entityKind,
    parsed.data.entityId,
    parsed.data.page,
    parsed.data.pageSize,
  )
  res.json(result)
}

export async function getReviewSummary(req: AuthenticatedRequest, res: Response) {
  const parsed = reviewMeQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid query', code: 'VALIDATION' })
    return
  }

  const summary = await reviewsService.getReviewSummary(
    parsed.data.companyId,
    parsed.data.entityKind,
    parsed.data.entityId,
  )
  res.json(summary)
}

export async function createReview(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = req.body as CreateReviewBody
    const item = await reviewsService.createReview(userId, body)
    res.status(201).json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function updateReview(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = req.body as UpdateReviewBody
    const item = await reviewsService.updateReview(userId, String(req.params.id), body)
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}
