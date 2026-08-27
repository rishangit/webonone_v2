import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateStockBody } from '../schemas/stocks.schema.js'
import * as stocksService from '../services/stocks.service.js'
import { handleServiceError } from './controllerUtils.js'

export const stocksController = {
  async suggestBatchNumber(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId
      if (!companyId) {
        res.status(403).json({ message: 'Company context required', code: 'FORBIDDEN' })
        return
      }
      const batchNumber = await stocksService.suggestBatchNumber(companyId)
      res.json({ batchNumber })
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const items = await stocksService.listStocks(
        String(req.params.id),
        String(req.params.variantId),
      )
      res.json({ items })
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const item = await stocksService.createStock(
        String(req.params.id),
        String(req.params.variantId),
        req.body as CreateStockBody,
        req.user!.companyId ?? null,
      )
      res.status(201).json(item)
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async setActive(req: AuthenticatedRequest, res: Response) {
    try {
      const item = await stocksService.setStockActive(
        String(req.params.id),
        String(req.params.variantId),
        String(req.params.stockId),
      )
      res.json(item)
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },
}
