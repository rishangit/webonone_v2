import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateProductVariantBody } from '../schemas/productVariants.schema.js'
import * as productVariantsService from '../services/productVariants.service.js'
import { handleServiceError } from './controllerUtils.js'

export const productVariantsController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const items = await productVariantsService.listProductVariants(String(req.params.id))
      res.json({ items })
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const item = await productVariantsService.getProductVariant(
        String(req.params.id),
        String(req.params.variantId),
      )
      res.json(item)
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const item = await productVariantsService.createProductVariant(
        String(req.params.id),
        req.body as CreateProductVariantBody,
      )
      res.status(201).json(item)
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },
}
