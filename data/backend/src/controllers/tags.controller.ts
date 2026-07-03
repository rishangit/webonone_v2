import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateTagBody, UpdateTagBody } from '../schemas/tags.schema.js'
import * as tagsService from '../services/tags.service.js'
import { handleServiceError } from './controllerUtils.js'

export async function listTags(req: AuthenticatedRequest, res: Response) {
  const result = await tagsService.listTags(req.query as Record<string, string>)
  res.json(result)
}

export async function getTag(req: AuthenticatedRequest, res: Response) {
  const item = await tagsService.getTagById(String(req.params.id))
  if (!item) {
    res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
    return
  }
  res.json(item)
}

export async function createTag(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as CreateTagBody
    const item = await tagsService.createTag(body)
    res.status(201).json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function updateTag(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as UpdateTagBody
    const item = await tagsService.updateTag(String(req.params.id), body)
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function deleteTag(req: AuthenticatedRequest, res: Response) {
  try {
    await tagsService.deleteTag(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}
