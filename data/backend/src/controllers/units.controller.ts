import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { CreateUnitBody, UpdateUnitBody } from '../schemas/units.schema.js'
import * as unitsService from '../services/units.service.js'
import { handleServiceError } from './controllerUtils.js'

export async function listUnits(req: AuthenticatedRequest, res: Response) {
  const result = await unitsService.listUnits(req.query as Record<string, string>)
  res.json(result)
}

export async function getUnit(req: AuthenticatedRequest, res: Response) {
  const item = await unitsService.getUnitById(String(req.params.id))
  if (!item) {
    res.status(404).json({ message: 'Not found', code: 'NOT_FOUND' })
    return
  }
  res.json(item)
}

export async function createUnit(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await unitsService.createUnit(req.body as CreateUnitBody, req.user?.role)
    res.status(201).json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function updateUnit(req: AuthenticatedRequest, res: Response) {
  try {
    const item = await unitsService.updateUnit(String(req.params.id), req.body as UpdateUnitBody)
    res.json(item)
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}

export async function deleteUnit(req: AuthenticatedRequest, res: Response) {
  try {
    await unitsService.deleteUnit(String(req.params.id))
    res.status(204).send()
  } catch (err) {
    if (!handleServiceError(err, res)) throw err
  }
}
