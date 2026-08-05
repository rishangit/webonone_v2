import type { Response } from 'express'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import * as userActivityService from '../services/userActivity.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

export async function listUserActivity(req: CompanySessionRequest, res: Response) {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const userId = String(req.params.userId ?? '')
    if (!userId || userId.length !== 21) {
      res.status(400).json({ message: 'Invalid user id', code: 'INVALID_USER_ID' })
      return
    }
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const result = await userActivityService.listUserActivity({
      companyId: req.sessionCompanyId,
      userId,
      page,
      pageSize,
    })
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getSessionTokenDetail(req: CompanySessionRequest, res: Response) {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const tokenId = String(req.params.tokenId ?? '')
    if (!tokenId || tokenId.length !== 21) {
      res.status(400).json({ message: 'Invalid token id', code: 'INVALID_TOKEN_ID' })
      return
    }
    const detail = await userActivityService.getSessionTokenHistoryDetail({
      companyId: req.sessionCompanyId,
      tokenId,
    })
    res.json({ detail })
  } catch (err) {
    handleServiceError(err, res)
  }
}
