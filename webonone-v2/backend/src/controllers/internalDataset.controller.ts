import type { Request, Response, NextFunction } from 'express'
import { datasetQueryBodySchema } from '../schemas/datasetQuery.schema.js'
import * as datasetQueryService from '../services/datasetQuery.service.js'

export async function queryCompanyDatasetInternal(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = String(req.params.companyId ?? '').trim()
    if (!companyId) {
      res.status(400).json({ message: 'companyId is required', code: 'VALIDATION_ERROR' })
      return
    }

    const parsed = datasetQueryBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      })
      return
    }

    const result = await datasetQueryService.executeDatasetQuery(companyId, parsed.data)
    res.json(result)
  } catch (err) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode: number }).statusCode)
        : 500
    if (statusCode >= 400 && statusCode < 500) {
      res.status(statusCode).json({
        message: err instanceof Error ? err.message : 'Bad request',
        code: 'DATASET_QUERY_ERROR',
      })
      return
    }
    next(err)
  }
}
