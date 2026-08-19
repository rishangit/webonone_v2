import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import * as catalogService from '../services/companyCatalog.service.js'

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

export async function listCatalog(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const items = await catalogService.listCatalogItems(
      session.userId,
      session.companyId,
      kind,
      { q },
    )
    res.json({ items })
  } catch (err) {
    handleServiceError(err, res)
  }
}

/** Membership-gated list for Settings → My Companies (no active company session required). */
export async function listCatalogForCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const items = await catalogService.listCatalogItems(
      req.user.id,
      String(req.params.companyId),
      kind,
      { q },
    )
    res.json({ items })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getCatalog(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.getCatalogItem(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

/** Membership-gated detail for Settings → My Companies catalog browse. */
export async function getCatalogForCompany(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return
  }
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.getCatalogItem(
      req.user.id,
      String(req.params.companyId),
      kind,
      String(req.params.id),
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function linkCatalog(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.linkFromLibrary(
      session.userId,
      session.companyId,
      kind,
      req.body.libraryEntityId,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function fromLibraryCatalog(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.createFromLibrary(
      session.userId,
      session.companyId,
      kind,
      req.body,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createCustomCatalog(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.createCustom(
      session.userId,
      session.companyId,
      kind,
      req.body,
    )
    res.status(201).json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function forkCatalog(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.forkCatalogItem(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body.payload,
      req.body.galleryImages,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateCatalog(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.updateCatalogItem(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateCatalogGallery(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.updateCatalogGallery(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body.galleryImages,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateCatalogPricing(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    const item = await catalogService.updateCatalogPricing(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
      req.body.listPrice ?? null,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateServiceForm(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const item = await catalogService.updateServiceFormTemplate(
      session.userId,
      session.companyId,
      String(req.params.id),
      req.body.formTemplateId ?? null,
    )
    res.json(item)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listServicesWithForm(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const items = await catalogService.listServicesWithLinkedForm(
      session.userId,
      session.companyId,
    )
    res.json({ items })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteCatalog(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = catalogService.parseKindParam(String(req.params.kind))
    await catalogService.deleteCatalogItem(
      session.userId,
      session.companyId,
      kind,
      String(req.params.id),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}
