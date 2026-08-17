import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

function mysqlErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  if ('code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code
  }
  if ('errno' in err && 'sqlMessage' in err) {
    return 'ER_MYSQL'
  }
  return undefined
}

function mapDatabaseError(err: unknown): { status: number; message: string; code: string } | null {
  const mysqlCode = mysqlErrorCode(err)
  if (mysqlCode === 'ER_NO_SUCH_TABLE') {
    return {
      status: 503,
      message: 'AI settings database is not ready. Run npm run migrate -w ai-root and restart the AI service.',
      code: 'DB_NOT_READY',
    }
  }
  if (mysqlCode === 'ER_DUP_ENTRY') {
    return {
      status: 409,
      message: 'AI settings already exist for this account. Refresh the page and try again.',
      code: 'DUPLICATE_SETTINGS',
    }
  }
  if (mysqlCode === 'ER_DATA_TOO_LONG') {
    return {
      status: 400,
      message: 'One or more AI settings values are too long.',
      code: 'VALIDATION_ERROR',
    }
  }
  return null
}

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
      console.error('[ai]', code, err)
    }
    res.status(status).json({ message, code })
    return
  }

  const dbError = mapDatabaseError(err)
  if (dbError) {
    console.error('[ai]', dbError.code, err)
    res.status(dbError.status).json({ message: dbError.message, code: dbError.code })
    return
  }

  if (err instanceof Error && err.message.includes('AI_CREDENTIALS_ENCRYPTION_KEY')) {
    console.error('[ai]', 'ENCRYPTION_KEY_INVALID', err)
    res.status(503).json({
      message: 'AI credential encryption is not configured on the server.',
      code: 'ENCRYPTION_NOT_CONFIGURED',
    })
    return
  }

  console.error('[ai]', 'INTERNAL_ERROR', err)
  res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' })
}
