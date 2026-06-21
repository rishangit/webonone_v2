import type { Request, Response } from 'express'
import * as mediaService from '../services/media.service.js'
import { readBlob } from '../services/storage.service.js'

export async function serveFile(req: Request, res: Response) {
  const row = await mediaService.getMediaItemRow(String(req.params.id))
  if (!row) {
    res.status(404).json({ message: 'File not found', code: 'NOT_FOUND' })
    return
  }

  try {
    const buffer = await readBlob(row.storage_key)
    res.setHeader('Content-Type', row.mime_type)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(buffer)
  } catch {
    res.status(404).json({ message: 'File not found', code: 'NOT_FOUND' })
  }
}
