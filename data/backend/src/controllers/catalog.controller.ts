import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateCatalogBody, UpdateCatalogBody } from '../schemas/catalog.schema.js'
import type { CatalogKind } from '../services/catalog.service.js'
import {
  productsService,
  servicesService,
  spacesService,
} from '../services/catalog.service.js'
import { handleServiceError } from './controllerUtils.js'

const SERVICE_MAP = {
  products: productsService,
  services: servicesService,
  spaces: spacesService,
} as const

function getService(kind: CatalogKind) {
  return SERVICE_MAP[kind]
}

export function createCatalogController(kind: CatalogKind) {
  const service = getService(kind)

  return {
    async list(req: AuthenticatedRequest, res: Response) {
      const result = await service.list(req.query as Record<string, string>)
      res.json(result)
    },

    async get(req: AuthenticatedRequest, res: Response) {
      const item = await service.getById(String(req.params.id))
      if (!item) {
        res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
        return
      }
      res.json(item)
    },

    async create(req: AuthenticatedRequest, res: Response) {
      try {
        const item = await service.create(req.body as CreateCatalogBody, req.user?.role)
        res.status(201).json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async update(req: AuthenticatedRequest, res: Response) {
      try {
        const item = await service.update(String(req.params.id), req.body as UpdateCatalogBody)
        res.json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async remove(req: AuthenticatedRequest, res: Response) {
      try {
        await service.delete(String(req.params.id))
        res.status(204).send()
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },
  }
}

export const productsController = createCatalogController('products')
export const servicesController = createCatalogController('services')
export const spacesController = createCatalogController('spaces')
