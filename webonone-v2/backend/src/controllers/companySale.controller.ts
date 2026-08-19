import type { Response } from 'express'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import { saleItemKindSchema, saleStatusSchema } from '../schemas/companySaleSchemas.js'
import * as saleService from '../services/companySale.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function requireSession(
  req: CompanySessionRequest | CompanyAdminSessionRequest,
  res: Response,
): { userId: string; companyId: string } | null {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return { userId: req.user.id, companyId: req.sessionCompanyId }
}

export async function listSales(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const customerUserId =
      typeof req.query.customerUserId === 'string' ? req.query.customerUserId : undefined
    const itemKindParsed = saleItemKindSchema.safeParse(req.query.itemKind)
    const statusParsed = saleStatusSchema.safeParse(req.query.status)
    const from = typeof req.query.from === 'string' ? req.query.from : undefined
    const to = typeof req.query.to === 'string' ? req.query.to : undefined
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const result = await saleService.listSales(session.companyId, {
      q,
      customerUserId,
      itemKind: itemKindParsed.success ? itemKindParsed.data : undefined,
      status: statusParsed.success ? statusParsed.data : undefined,
      from,
      to,
      page,
      pageSize,
    })
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getSale(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const sale = await saleService.getSale(session.companyId, String(req.params.id))
    res.json(sale)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createSale(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const sale = await saleService.createSale(session.userId, session.companyId, req.body)
    res.status(201).json(sale)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function voidSale(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const sale = await saleService.voidSale(session.companyId, String(req.params.id))
    res.json(sale)
  } catch (err) {
    handleServiceError(err, res)
  }
}
