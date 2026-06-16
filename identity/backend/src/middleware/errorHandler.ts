import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AuthError } from '../services/auth.service.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code })
    return
  }

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
