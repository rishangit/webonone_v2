import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' })
}
