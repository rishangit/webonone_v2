import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import * as mediaService from '../services/media.service.js'
import { scopeSchema, folderPathSchema, listMediaQuerySchema } from '../schemas/mediaSchemas.js'

export async function uploadSingle(req: AuthenticatedRequest, res: Response) {
  const file = req.file
  if (!file) {
    res.status(400).json({ message: 'File is required', code: 'VALIDATION_ERROR' })
    return
  }

  const scopeResult = scopeSchema.safeParse(req.body.scope)
  if (!scopeResult.success) {
    res.status(400).json({ message: 'Invalid scope', code: 'VALIDATION_ERROR' })
    return
  }

  const folderPathResult = folderPathSchema.safeParse(req.body.folderPath ?? '/')
  if (!folderPathResult.success) {
    res.status(400).json({ message: 'Invalid folder path', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const item = await mediaService.uploadMediaItem({
      scope: scopeResult.data,
      folderPath: folderPathResult.data,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      userId: req.user!.id,
    })
    res.status(201).json({ item })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    res.status(400).json({ message, code: 'UPLOAD_FAILED' })
  }
}

export async function uploadBatch(req: AuthenticatedRequest, res: Response) {
  const files = req.files as Express.Multer.File[] | undefined
  if (!files?.length) {
    res.status(400).json({ message: 'At least one file is required', code: 'VALIDATION_ERROR' })
    return
  }

  const scopeResult = scopeSchema.safeParse(req.body.scope)
  if (!scopeResult.success) {
    res.status(400).json({ message: 'Invalid scope', code: 'VALIDATION_ERROR' })
    return
  }

  const folderPathResult = folderPathSchema.safeParse(req.body.folderPath ?? '/')
  if (!folderPathResult.success) {
    res.status(400).json({ message: 'Invalid folder path', code: 'VALIDATION_ERROR' })
    return
  }

  const items = []
  const failed: { fileName: string; reason: string }[] = []

  for (const file of files) {
    try {
      const item = await mediaService.uploadMediaItem({
        scope: scopeResult.data,
        folderPath: folderPathResult.data,
        fileName: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
        userId: req.user!.id,
      })
      items.push(item)
    } catch (err) {
      failed.push({
        fileName: file.originalname,
        reason: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  res.status(201).json({
    sessionId: null,
    items,
    failed,
  })
}

export async function listItems(req: AuthenticatedRequest, res: Response) {
  const parsed = listMediaQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }

  try {
    const result = await mediaService.listMediaItems(parsed.data)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: err instanceof Error ? err.message : 'Failed to list media',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function getItem(req: AuthenticatedRequest, res: Response) {
  const item = await mediaService.getMediaItemById(String(req.params.id))
  if (!item) {
    res.status(404).json({ message: 'Media item not found', code: 'NOT_FOUND' })
    return
  }
  res.json({ item })
}

export async function deleteItem(req: AuthenticatedRequest, res: Response) {
  const deleted = await mediaService.deleteMediaItem(String(req.params.id))
  if (!deleted) {
    res.status(404).json({ message: 'Media item not found', code: 'NOT_FOUND' })
    return
  }
  res.json({ id: String(req.params.id), deleted: true })
}
