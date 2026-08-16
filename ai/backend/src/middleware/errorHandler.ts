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

  if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number') {
    const status = (err as { status: number }).status
    const message = err instanceof Error ? err.message : 'Request failed'
    const code =
      'code' in err && typeof (err as { code: unknown }).code === 'string'
        ? (err as { code: string }).code
        : 'REQUEST_ERROR'
    if (status >= 500) {
      console.error('[ai]', code)
    }
    res.status(status).json({ message, code })
    return
  }

  console.error('[ai]', 'INTERNAL_ERROR')
  res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' })
}
