import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/form.service.js'
import {
  createSubmission,
  getSubmission,
  listSubmissions,
} from '../services/submission.service.js'
import { createSubmissionBodySchema } from '../schemas/submissionSchemas.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) {
    throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  }
  return companyId
}

/** Super admins without an active company may read submissions across all companies. */
function companyScopeForRead(req: AuthenticatedRequest): string | undefined {
  const companyId = req.user?.companyId
  if (companyId) return companyId
  if (req.user?.role === 'super_admin') return undefined
  throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
}

export async function listSubmissionsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const companyId = companyScopeForRead(req)
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const subjectUserId =
      typeof req.query.subjectUserId === 'string' ? req.query.subjectUserId : undefined
    const filledByUserId =
      typeof req.query.filledByUserId === 'string' ? req.query.filledByUserId : undefined
    const sessionTokenId =
      typeof req.query.sessionTokenId === 'string' ? req.query.sessionTokenId : undefined
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined
    const occurrenceDate =
      typeof req.query.occurrenceDate === 'string' ? req.query.occurrenceDate : undefined

    const result = await listSubmissions({
      companyId,
      page,
      pageSize,
      subjectUserId,
      filledByUserId,
      sessionTokenId,
      eventId,
      occurrenceDate,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getSubmissionHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const companyId = companyScopeForRead(req)
    const submission = await getSubmission({ companyId, id: String(req.params.id) })
    res.json({ submission })
  } catch (err) {
    next(err)
  }
}

export async function createSubmissionHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const companyId = companyIdOrThrow(req)
    const body = createSubmissionBodySchema.parse(req.body)
    const user = req.user!
    const submission = await createSubmission({
      companyId,
      filledByUserId: user.id,
      filledByRole: user.role,
      body,
    })
    res.status(201).json({ submission })
  } catch (err) {
    next(err)
  }
}
