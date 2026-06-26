import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Request } from 'express'
import { companyProxy } from '../services/companyProxy.service.js'

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return undefined
  return header.slice(7)
}

function handleProxyError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({ message, code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED' })
}

export async function getMyCompany(req: AuthenticatedRequest, res: Response) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const data = await companyProxy('/me/company', { identityToken: token })
    res.json(data)
  } catch (err) {
    handleProxyError(err, res)
  }
}

export async function registerCompany(req: AuthenticatedRequest, res: Response) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const data = await companyProxy('/companies', {
      method: 'POST',
      body: req.body,
      identityToken: token,
    })
    res.status(201).json(data)
  } catch (err) {
    handleProxyError(err, res)
  }
}

export async function superAdminLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await companyProxy<{ accessToken: string; displayName: string }>('/auth/super-admin/login', {
      method: 'POST',
      body: req.body,
    })
    res.json(data)
  } catch (err) {
    handleProxyError(err, res)
  }
}

export async function listPendingCompanies(req: AuthenticatedRequest, res: Response) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const data = await companyProxy('/admin/companies/pending', { superAdminToken: token })
    res.json(data)
  } catch (err) {
    handleProxyError(err, res)
  }
}

export async function approveCompany(req: AuthenticatedRequest, res: Response) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const data = await companyProxy(`/admin/companies/${String(req.params.id)}/approve`, {
      method: 'POST',
      superAdminToken: token,
    })
    res.json(data)
  } catch (err) {
    handleProxyError(err, res)
  }
}
