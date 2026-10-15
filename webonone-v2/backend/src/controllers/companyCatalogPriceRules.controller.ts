import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import type { CatalogPriceRuleBody } from '../schemas/companyCatalogPriceRules.schema.js'
import * as priceRulesService from '../services/companyCatalogPriceRules.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function requireSession(req: CompanySessionRequest | CompanyAdminSessionRequest, res: Response): {
  userId: string
  companyId: string
} | null {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return { userId: req.user.id, companyId: req.sessionCompanyId }
}

export async function listPriceRules(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = priceRulesService.parsePriceKind(String(req.params.kind))
    const items = await priceRulesService.listPriceRules(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
    )
    res.json({ items })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listPriceRulesForCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const kind = priceRulesService.parsePriceKind(String(req.params.kind))
    const items = await priceRulesService.listPriceRules(
      req.user.id,
      String(req.params.companyId),
      kind,
      String(req.params.id),
    )
    res.json({ items })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createPriceRule(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = priceRulesService.parsePriceKind(String(req.params.kind))
    const item = await priceRulesService.createPriceRule(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body as CatalogPriceRuleBody,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updatePriceRule(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = priceRulesService.parsePriceKind(String(req.params.kind))
    const item = await priceRulesService.updatePriceRule(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.ruleId),
      req.body as CatalogPriceRuleBody,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deletePriceRule(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = priceRulesService.parsePriceKind(String(req.params.kind))
    await priceRulesService.deletePriceRule(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.ruleId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}
