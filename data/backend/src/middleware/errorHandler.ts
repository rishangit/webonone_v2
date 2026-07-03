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

  if (err instanceof Error && err.message === 'DUPLICATE_NAME') {
    res.status(409).json({ message: 'Name already exists', code: 'DUPLICATE_NAME' })
    return
  }

  if (err instanceof Error && err.message === 'NOT_FOUND') {
    res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
    return
  }

  if (err instanceof Error && err.message === 'FK_CONSTRAINT') {
    res.status(409).json({ message: 'Cannot delete: referenced by other records', code: 'FK_CONSTRAINT' })
    return
  }

  console.error(err)
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(500).json({ message, code: 'INTERNAL_ERROR' })
}
