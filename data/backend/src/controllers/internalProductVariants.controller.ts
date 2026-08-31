import type { Request, Response } from 'express'
import * as productVariantsService from '../services/productVariants.service.js'
import { handleServiceError } from './controllerUtils.js'

export const internalProductVariantsController = {
  async get(req: Request, res: Response) {
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
}
