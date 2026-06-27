import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { SuperAdminRequest } from '../middleware/requireSuperAdmin.js'
import * as companyService from '../services/company.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({ message, code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED' })
}

export async function getMyCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const result = await companyService.getMyCompany(req.user.id)
    if (!result) {
      res.status(404).json({ message: 'No company registered', code: 'NOT_FOUND' })
      return
    }
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function registerCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const result = await companyService.registerCompany(req.user.id, req.body)
    res.status(201).json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getSuperAdminMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const profile = await companyService.getSuperAdminProfile(req.user.email)
    if (!profile) {
      res.status(404).json({ message: 'Not a super admin', code: 'NOT_FOUND' })
      return
    }
    res.json(profile)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listAllCompanies(_req: SuperAdminRequest, res: Response) {
  try {
    const result = await companyService.listAllCompanies()
    res.json({ items: result })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listPendingCompanies(_req: SuperAdminRequest, res: Response) {
  try {
    const result = await companyService.listPendingCompanies()
    res.json({ items: result })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function approveCompany(req: SuperAdminRequest, res: Response) {
  if (!req.superAdmin) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const result = await companyService.approveCompany(String(req.params.id), req.superAdmin.id)
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateCompanyStatus(req: SuperAdminRequest, res: Response) {
  if (!req.superAdmin) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const result = await companyService.updateCompanyStatus(
      String(req.params.id),
      req.body,
      req.superAdmin.id,
    )
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}
