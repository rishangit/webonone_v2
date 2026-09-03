import type { Response } from 'express'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import type { SuperAdminRequest } from '../middleware/requireSuperAdmin.js'
import { analyticsRangeQuerySchema } from '../schemas/companyAnalyticsSchemas.js'
import * as analyticsService from '../services/companyAnalytics.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

export const getCompanyAnalytics = async (req: CompanySessionRequest, res: Response) => {
  if (!req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  const parsed = analyticsRangeQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }
  try {
    const result = await analyticsService.getCompanyAnalytics(
      req.sessionCompanyId,
      parsed.data.from,
      parsed.data.to,
    )
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export const getPlatformAnalytics = async (_req: SuperAdminRequest, res: Response) => {
  const parsed = analyticsRangeQuerySchema.safeParse(_req.query)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }
  try {
    const result = await analyticsService.getPlatformAnalytics(parsed.data.from, parsed.data.to)
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}
