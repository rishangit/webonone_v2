import type { Request, Response } from 'express'
import type { ConsumeStockBody } from '../schemas/stocks.schema.js'
import * as stocksService from '../services/stocks.service.js'
import { handleServiceError } from './controllerUtils.js'

export const internalStocksController = {
  async get(req: Request, res: Response) {
    try {
      const item = await stocksService.getStock(
        String(req.params.id),
        String(req.params.variantId),
        String(req.params.stockId),
      )
      res.json(item)
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async consume(req: Request, res: Response) {
    try {
      const item = await stocksService.consumeStock(
        String(req.params.id),
        String(req.params.variantId),
        String(req.params.stockId),
        (req.body as ConsumeStockBody).quantity,
      )
      res.json(item)
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },
}
