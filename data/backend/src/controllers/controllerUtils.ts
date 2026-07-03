import type { Response } from 'express'

export function handleServiceError(err: unknown, res: Response): boolean {
  if (err instanceof Error) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
      return true
    }
    if (err.message === 'DUPLICATE_NAME') {
      res.status(409).json({ message: 'Name already exists', code: 'DUPLICATE_NAME' })
      return true
    }
    if (err.message === 'FK_CONSTRAINT') {
      res.status(409).json({ message: 'Cannot delete: referenced by other records', code: 'FK_CONSTRAINT' })
      return true
    }
  }
  return false
}
