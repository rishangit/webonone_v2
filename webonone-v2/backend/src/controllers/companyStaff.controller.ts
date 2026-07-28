import type { Response } from 'express'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import * as staffService from '../services/companyStaff.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function requireSession(
  req: CompanyAdminSessionRequest,
  res: Response,
): { companyId: string } | null {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return { companyId: req.sessionCompanyId }
}

export async function listStaff(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const result = await staffService.listCompanyStaff(session.companyId)
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getStaff(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await staffService.getCompanyStaff(session.companyId, String(req.params.id))
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createStaff(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await staffService.createCompanyStaff(session.companyId, req.body)
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateStaff(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await staffService.updateCompanyStaff(
      session.companyId,
      String(req.params.id),
      req.body,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteStaff(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await staffService.deleteCompanyStaff(session.companyId, String(req.params.id))
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}
