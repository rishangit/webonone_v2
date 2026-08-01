import type { Request, Response } from 'express'
import * as webononeCatalogClient from '../clients/webononeCatalogClient.js'

export async function searchCatalog(req: Request, res: Response) {
  const result = await webononeCatalogClient.searchCatalog({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
    lat: typeof req.query.lat === 'string' ? req.query.lat : undefined,
    lng: typeof req.query.lng === 'string' ? req.query.lng : undefined,
  })
  res.json(result)
}

export async function getCatalogItem(req: Request, res: Response) {
  const kind = typeof req.params.kind === 'string' ? req.params.kind : ''
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const item = await webononeCatalogClient.getCatalogItem(kind, id, {
    lat: typeof req.query.lat === 'string' ? req.query.lat : undefined,
    lng: typeof req.query.lng === 'string' ? req.query.lng : undefined,
  })
  res.json(item)
}
