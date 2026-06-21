import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

export type ValidatedQueryRequest<T> = Request & { validatedQuery: T }

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten(),
      })
      return
    }
    ;(req as ValidatedQueryRequest<z.infer<T>>).validatedQuery = result.data
    next()
  }
}
