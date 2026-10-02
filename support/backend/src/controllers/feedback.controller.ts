import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { listFeedbackQuerySchema } from '../schemas/feedbackSchemas.js'
import type {
  CreateFeedbackBody,
  CreateFeedbackCommentBody,
  UpdateFeedbackBody,
  UpdateFeedbackStatusBody,
} from '../schemas/feedbackSchemas.js'
import * as feedbackCommentsService from '../services/feedbackComments.service.js'
import * as feedbackService from '../services/feedback.service.js'

function handleServiceError(err: unknown, res: Response): boolean {
  if (err instanceof Error && err.message === 'NOT_FOUND') {
    res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
    return true
  }
  if (err instanceof Error && err.message === 'INVALID_ATTACHMENT') {
    res.status(400).json({ message: 'Invalid screenshot attachment', code: 'INVALID_ATTACHMENT' })
    return true
  }
  if (err instanceof Error && err.message === 'MEDIA_FETCH_FAILED') {
    res.status(502).json({ message: 'Could not verify attachment with Media service', code: 'MEDIA_UNAVAILABLE' })
    return true
  }
  if (err instanceof Error && err.message === 'FORBIDDEN') {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return true
  }
  return false
}

export async function getFeedback(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await feedbackService.getFeedbackReportById(String(req.params.id))
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}

export async function listFeedback(req: AuthenticatedRequest, res: Response) {
  const parsed = listFeedbackQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }

  const result = await feedbackService.listFeedbackReports(parsed.data, req.user?.id)
  res.json(result)
}

export async function createFeedback(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  const token = req.headers.authorization?.slice(7)
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = req.body as CreateFeedbackBody
    const item = await feedbackService.createFeedbackReport(
      body,
      {
        id: req.user.id,
        email: req.user.email,
      },
      token,
    )
    res.status(201).json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}

export async function updateFeedback(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  const token = req.headers.authorization?.slice(7)
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = req.body as UpdateFeedbackBody
    const item = await feedbackService.updateFeedbackReport(String(req.params.id), body, {
      id: req.user.id,
      email: req.user.email,
      platformRole: req.user.platformRole,
    }, token)
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}

export async function listFeedbackComments(req: AuthenticatedRequest, res: Response) {
  try {
    const items = await feedbackCommentsService.listFeedbackComments(String(req.params.id))
    res.json({ items })
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}

export async function createFeedbackComment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = req.body as CreateFeedbackCommentBody
    const item = await feedbackCommentsService.createFeedbackComment(
      String(req.params.id),
      body,
      { id: req.user.id, email: req.user.email },
    )
    res.status(201).json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}

export async function markFeedbackViewed(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    await feedbackCommentsService.markFeedbackReportViewed(String(req.params.id), req.user.id)
    res.status(204).send()
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}

export async function updateFeedbackStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as UpdateFeedbackStatusBody
    const item = await feedbackService.updateFeedbackStatus(String(req.params.id), body)
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) {
      throw err
    }
  }
}
