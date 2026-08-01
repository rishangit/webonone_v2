import type { Request, Response } from 'express'
import * as publicCatalogSearchService from '../services/publicCatalogSearch.service.js'

export async function searchCatalog(req: Request, res: Response) {
  const result = await publicCatalogSearchService.searchPublicCatalog({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: req.query.page,
    pageSize: req.query.pageSize,
    lat: req.query.lat,
    lng: req.query.lng,
  })
  res.json(result)
}

export async function getCatalogItem(req: Request, res: Response) {
  const kind = typeof req.params.kind === 'string' ? req.params.kind : ''
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const item = await publicCatalogSearchService.getPublicCatalogItem({
    kind,
    id,
    lat: req.query.lat,
    lng: req.query.lng,
  })
  if (!item) {
    res.status(404).json({ message: 'Catalog item not found', code: 'NOT_FOUND' })
    return
  }
  res.json(item)
}
