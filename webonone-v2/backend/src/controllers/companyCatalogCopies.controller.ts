import type { Response } from 'express'
import type { CompanyAdminSessionRequest } from '../middleware/requireCompanyAdminSession.js'
import type { CompanySessionRequest } from '../middleware/requireCompanySession.js'
import type {
  CopyAttributesFromLibraryBody,
  CopyAttributeValuesFromLibraryBody,
  CopyVariantsFromLibraryBody,
  UpdateCompanyAttributeValueBody,
  UpdateCompanyVariantAttributeValuesBody,
} from '../schemas/companyCatalogSchemas.js'
import * as copiesService from '../services/companyCatalogCopies.service.js'
import { parseKindParam } from '../services/companyCatalog.service.js'

function handleServiceError(err: unknown, res: Response) {
  const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(statusCode).json({
    message,
    code: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
  })
}

function requireSession(req: CompanySessionRequest | CompanyAdminSessionRequest, res: Response) {
  if (!req.user || !req.sessionCompanyId) {
    res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  return { userId: req.user.id, companyId: req.sessionCompanyId }
}

function bearerToken(req: CompanySessionRequest | CompanyAdminSessionRequest): string {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing access token'), { statusCode: 401 })
  }
  return header.slice(7)
}

export async function ensureLibraryLink(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const kind = parseKindParam(String(req.params.kind))
    if (kind !== 'products' && kind !== 'services' && kind !== 'spaces') {
      res.status(400).json({ message: 'Invalid catalog kind', code: 'REQUEST_FAILED' })
      return
    }
    const libraryEntityId = await copiesService.ensureLibraryEntityId(
      session.companyId,
      kind,
      String(req.params.id),
      bearerToken(req),
    )
    res.json({ libraryEntityId })
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listAttributes(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const result = await copiesService.listAttributes(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      bearerToken(req),
    )
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function attachAttributesToLibrary(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const body = req.body as CopyAttributesFromLibraryBody
    const result = await copiesService.attachAttributesToLibrary(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      body.attributeIds,
      bearerToken(req),
    )
    res.status(201).json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function copyAttributesFromLibrary(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const body = req.body as CopyAttributesFromLibraryBody
    const result = await copiesService.copyAttributesFromLibrary(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      body.attributeIds,
      bearerToken(req),
    )
    res.status(201).json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteAttribute(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await copiesService.deleteAttribute(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      String(req.params.attributeId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function copyAttributeValuesFromLibrary(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const body = req.body as CopyAttributeValuesFromLibraryBody
    const result = await copiesService.copyAttributeValuesFromLibrary(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      body.libraryValueIds,
      bearerToken(req),
    )
    res.status(201).json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function createAttributeValue(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const body = req.body as UpdateCompanyAttributeValueBody
    const result = await copiesService.createAttributeValueInLibrary(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      String(req.params.attributeId),
      body,
      bearerToken(req),
    )
    res.status(201).json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateAttributeValue(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await copiesService.updateAttributeValue(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      String(req.params.valueId),
      req.body as UpdateCompanyAttributeValueBody,
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function setAttributeValueDefault(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await copiesService.setAttributeValueDefault(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      String(req.params.valueId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteAttributeValue(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await copiesService.deleteAttributeValue(
      session.userId,
      session.companyId,
      parseKindParam(String(req.params.kind)),
      String(req.params.id),
      String(req.params.valueId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function listVariants(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const result = await copiesService.listVariants(
      session.userId,
      session.companyId,
      String(req.params.productId),
      bearerToken(req),
    )
    res.json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function getVariant(req: CompanySessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const variant = await copiesService.getVariant(
      session.userId,
      session.companyId,
      String(req.params.productId),
      String(req.params.variantId),
      bearerToken(req),
    )
    res.json(variant)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function copyVariantsFromLibrary(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const body = req.body as CopyVariantsFromLibraryBody
    const result = await copiesService.copyVariantsFromLibrary(
      session.userId,
      session.companyId,
      String(req.params.productId),
      body.libraryVariantIds,
      bearerToken(req),
    )
    res.status(201).json(result)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function updateVariantAttributeValues(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    const body = req.body as UpdateCompanyVariantAttributeValuesBody
    const variant = await copiesService.updateVariantAttributeValues(
      session.userId,
      session.companyId,
      String(req.params.productId),
      String(req.params.variantId),
      body,
      bearerToken(req),
    )
    res.json(variant)
  } catch (err) {
    handleServiceError(err, res)
  }
}

export async function deleteVariant(req: CompanyAdminSessionRequest, res: Response) {
  const session = requireSession(req, res)
  if (!session) return
  try {
    await copiesService.deleteVariant(
      session.userId,
      session.companyId,
      String(req.params.productId),
      String(req.params.variantId),
    )
    res.status(204).send()
  } catch (err) {
    handleServiceError(err, res)
  }
}
