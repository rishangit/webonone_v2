import type { Response } from 'express'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import type { PlatformRole } from '../middleware/requireSuperAdmin.js'
import { listCompanyStaffLeavesQuerySchema } from '../schemas/companyStaffLeaveSchemas.js'
import * as leaveService from '../services/companyStaffLeave.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function requireSession(
  req: CompanySessionRequest,
  res: Response,
): { companyId: string; userId: string; role: PlatformRole } | null {
  if (!req.user || !req.sessionCompanyId || !req.sessionRole) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return {
    companyId: req.sessionCompanyId,
    userId: req.user.id,
    role: req.sessionRole,
  }
}

export async function listStaffLeaves(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return

  const parsed = listCompanyStaffLeavesQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }

  try {
    const result = await leaveService.listCompanyStaffLeaves(
      session.companyId,
      String(req.params.id),
      session.userId,
      session.role,
      parsed.data,
    )
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createStaffLeave(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return

  try {
    const item = await leaveService.createCompanyStaffLeave(
      session.companyId,
      String(req.params.id),
      session.userId,
      session.role,
      req.body,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

function requireAdminSession(
  req: CompanyAdminSessionRequest,
  res: Response,
): { companyId: string; userId: string } | null {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return {
    companyId: req.sessionCompanyId,
    userId: req.user.id,
  }
}

export async function approveStaffLeave(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireAdminSession(req, res)
  if (!session) return

  try {
    const item = await leaveService.approveCompanyStaffLeave(
      session.companyId,
      String(req.params.id),
      String(req.params.leaveId),
      session.userId,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function rejectStaffLeave(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireAdminSession(req, res)
  if (!session) return

  try {
    const item = await leaveService.rejectCompanyStaffLeave(
      session.companyId,
      String(req.params.id),
      String(req.params.leaveId),
      session.userId,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteStaffLeave(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return

  try {
    await leaveService.deleteCompanyStaffLeave(
      session.companyId,
      String(req.params.id),
      String(req.params.leaveId),
      session.userId,
      session.role,
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}
