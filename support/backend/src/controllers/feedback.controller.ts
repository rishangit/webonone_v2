import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { listFeedbackQuerySchema } from '../schemas/feedbackSchemas.js'
import type { CreateFeedbackBody, UpdateFeedbackStatusBody } from '../schemas/feedbackSchemas.js'
import * as feedbackService from '../services/feedback.service.js'

function handleServiceError(err: unknown, res: Response): boolean {
  if (err instanceof Error && err.message === 'NOT_FOUND') {
    res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
    return true
  }
  return false
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

  const result = await feedbackService.listFeedbackReports(parsed.data)
  res.json(result)
}

export async function createFeedback(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const body = req.body as CreateFeedbackBody
    const item = await feedbackService.createFeedbackReport(body, {
      id: req.user.id,
      email: req.user.email,
    })
    res.status(201).json(item)
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
