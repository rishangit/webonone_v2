import type { Request, Response } from 'express'
import * as webononeCatalogClient from '../clients/webononeCatalogClient.js'

export async function searchCatalog(req: Request, res: Response) {
  const result = await webononeCatalogClient.searchCatalog({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
  })
  res.json(result)
}
