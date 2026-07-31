import type { Request, Response } from 'express'
import * as publicCatalogSearchService from '../services/publicCatalogSearch.service.js'

export async function searchCatalog(req: Request, res: Response) {
  const result = await publicCatalogSearchService.searchPublicCatalog({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: req.query.page,
    pageSize: req.query.pageSize,
  })
  res.json(result)
}
