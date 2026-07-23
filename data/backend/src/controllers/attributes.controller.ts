import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateAttributeBody, UpdateAttributeBody } from '../schemas/attributes.schema.js'
import * as attributesService from '../services/attributes.service.js'
import { handleServiceError } from './controllerUtils.js'

export async function listAttributes(req: AuthenticatedRequest, res: Response) {
  const result = await attributesService.listAttributes(req.query as Record<string, string>)
  res.json(result)
}

export async function getAttribute(req: AuthenticatedRequest, res: Response) {
  const item = await attributesService.getAttributeById(String(req.params.id))
  if (!item) {
    res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
    return
  }
  res.json(item)
}

export async function createAttribute(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await attributesService.createAttribute(
      req.body as CreateAttributeBody,
      req.user?.role,
    )
    res.status(201).json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function updateAttribute(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await attributesService.updateAttribute(
      String(req.params.id),
      req.body as UpdateAttributeBody,
    )
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function deleteAttribute(req: AuthenticatedRequest, res: Response) {
  try {
    await attributesService.deleteAttribute(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}
