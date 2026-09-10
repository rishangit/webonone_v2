import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import {
  createWebsiteDataset,
  deleteWebsiteDataset,
  getPublicWebsiteDatasetData,
  getWebsiteDataset,
  getWebsiteDatasetFieldCatalog,
  listWebsiteDatasets,
  previewWebsiteDataset,
  updateWebsiteDataset,
} from '../services/websiteDataset.service.js'
import {
  createWebsiteDatasetSchema,
  datasetPreviewQuerySchema,
  updateWebsiteDatasetSchema,
} from '../schemas/websiteDatasets.schema.js'
import { resolveCompanyFromWebOnOne } from '../services/webononeCompanyClient.js'

function companyIdOrThrow(req: AuthenticatedRequest): string {
  const companyId = req.user?.companyId
  if (!companyId) throw new HttpError(403, 'Company context required', 'COMPANY_REQUIRED')
  return companyId
}

export async function listWebsiteDatasetsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    res.json(await listWebsiteDatasets({ companyId: companyIdOrThrow(req), page, pageSize, q }))
  } catch (err) {
    next(err)
  }
}

export async function getWebsiteDatasetFieldCatalogHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    res.json(getWebsiteDatasetFieldCatalog())
  } catch (err) {
    next(err)
  }
}

export async function getWebsiteDatasetHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const item = await getWebsiteDataset({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function createWebsiteDatasetHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = createWebsiteDatasetSchema.parse(req.body)
    const item = await createWebsiteDataset({
      companyId: companyIdOrThrow(req),
      userId: req.user!.id,
      body,
    })
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateWebsiteDatasetHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = updateWebsiteDatasetSchema.parse(req.body)
    const item = await updateWebsiteDataset({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      body,
    })
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteWebsiteDatasetHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await deleteWebsiteDataset({ companyId: companyIdOrThrow(req), id: String(req.params.id) })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function previewWebsiteDatasetHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = datasetPreviewQuerySchema.parse({
      page: req.body?.page ?? req.query.page,
      pageSize: req.body?.pageSize ?? req.query.pageSize,
    })
    const result = await previewWebsiteDataset({
      companyId: companyIdOrThrow(req),
      id: String(req.params.id),
      page: query.page,
      pageSize: query.pageSize,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getPublicWebsiteDatasetDataHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const company = await resolveCompanyFromWebOnOne(String(req.params.companyId))
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const result = await getPublicWebsiteDatasetData({
      companyId: company.id,
      datasetId: String(req.params.datasetId),
      page,
      pageSize,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}
