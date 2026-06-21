import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { listFoldersQuerySchema } from '../schemas/mediaSchemas.js'
import * as folderService from '../services/folder.service.js'

export async function createFolder(req: AuthenticatedRequest, res: Response) {
  try {
    const folder = await folderService.createFolder({
      ...req.body,
      userId: req.user!.id,
    })
    res.status(201).json({ folder })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create folder'
    res.status(400).json({ message, code: 'FOLDER_CREATE_FAILED' })
  }
}

export async function listFolders(req: AuthenticatedRequest, res: Response) {
  const parsed = listFoldersQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    })
    return
  }

  try {
    const folders = await folderService.listFolders(parsed.data)
    res.json({ folders })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: err instanceof Error ? err.message : 'Failed to list folders',
      code: 'INTERNAL_ERROR',
    })
  }
}

export async function renameFolder(req: AuthenticatedRequest, res: Response) {
  const folder = await folderService.renameFolder(String(req.params.id), req.body.name)
  if (!folder) {
    res.status(404).json({ message: 'Folder not found', code: 'NOT_FOUND' })
    return
  }
  res.json({ folder })
}

export async function deleteFolder(req: AuthenticatedRequest, res: Response) {
  const result = await folderService.deleteFolder(String(req.params.id))
  if (!result.deleted) {
    res.status(400).json({ message: result.reason ?? 'Failed to delete folder', code: 'FOLDER_DELETE_FAILED' })
    return
  }
  res.json({ id: String(req.params.id), deleted: true })
}
