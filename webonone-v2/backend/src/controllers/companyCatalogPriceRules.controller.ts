import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import type {
  CatalogDiscountBody,
  CatalogPriceBody,
} from '../schemas/companyCatalogPriceRules.schema.js'
import * as pricingService from '../services/companyCatalogPriceRules.service.js'

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

export async function listPrices(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parsePriceKind(String(req.params.kind))
    const items = await pricingService.listPrices(
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

export async function listPricesForCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const kind = pricingService.parsePriceKind(String(req.params.kind))
    const items = await pricingService.listPrices(
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

export async function createPrice(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parsePriceKind(String(req.params.kind))
    const item = await pricingService.createPrice(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body as CatalogPriceBody,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updatePrice(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parsePriceKind(String(req.params.kind))
    const item = await pricingService.updatePrice(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.priceId),
      req.body as CatalogPriceBody,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function activatePrice(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parsePriceKind(String(req.params.kind))
    const item = await pricingService.activatePrice(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.priceId),
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deletePrice(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parsePriceKind(String(req.params.kind))
    await pricingService.deletePrice(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.priceId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listDiscounts(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parseDiscountKind(String(req.params.kind))
    const items = await pricingService.listDiscounts(
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

export async function listDiscountsForCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const kind = pricingService.parseDiscountKind(String(req.params.kind))
    const items = await pricingService.listDiscounts(
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

export async function createDiscount(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parseDiscountKind(String(req.params.kind))
    const item = await pricingService.createDiscount(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body as CatalogDiscountBody,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateDiscount(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parseDiscountKind(String(req.params.kind))
    const item = await pricingService.updateDiscount(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.discountId),
      req.body as CatalogDiscountBody,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteDiscount(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = pricingService.parseDiscountKind(String(req.params.kind))
    await pricingService.deleteDiscount(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      String(req.params.discountId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}
