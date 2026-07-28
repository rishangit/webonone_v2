import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type {
  CatalogAttributeValueBody,
  CreateCatalogBody,
  ReplaceCatalogAttributesBody,
  UpdateCatalogBody,
  UpdateCatalogGalleryBody,
} from '../schemas/catalog.schema.js'
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

    async updateGallery(req: AuthenticatedRequest, res: Response) {
      try {
        const body = req.body as UpdateCatalogGalleryBody
        const item = await service.updateGallery(String(req.params.id), body.galleryImages)
        res.json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async replaceAttributes(req: AuthenticatedRequest, res: Response) {
      try {
        const body = req.body as ReplaceCatalogAttributesBody
        const item = await service.replaceAttributes(String(req.params.id), body)
        res.json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async addAttributeValue(req: AuthenticatedRequest, res: Response) {
      try {
        const item = await service.addAttributeValue(
          String(req.params.id),
          String(req.params.attributeId),
          req.body as CatalogAttributeValueBody,
        )
        res.status(201).json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async updateAttributeValue(req: AuthenticatedRequest, res: Response) {
      try {
        const item = await service.updateAttributeValue(
          String(req.params.id),
          String(req.params.valueId),
          req.body as CatalogAttributeValueBody,
        )
        res.json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async deleteAttributeValue(req: AuthenticatedRequest, res: Response) {
      try {
        const item = await service.deleteAttributeValue(
          String(req.params.id),
          String(req.params.valueId),
        )
        res.json(item)
      } catch (err) {
        if (!handleServiceError(err, res)) throw err
      }
    },

    async setAttributeValueDefault(req: AuthenticatedRequest, res: Response) {
      try {
        const item = await service.setAttributeValueDefault(
          String(req.params.id),
          String(req.params.valueId),
        )
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
