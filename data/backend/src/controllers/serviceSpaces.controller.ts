import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { ReplaceServiceSpacesBody } from '../schemas/catalog.schema.js'
import * as serviceSpacesService from '../services/serviceSpaces.service.js'
import { handleServiceError } from './controllerUtils.js'

export const serviceSpacesController = {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const items = await serviceSpacesService.listServiceSpaces(String(req.params.id))
      res.json({ items })
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },

  async replace(req: AuthenticatedRequest, res: Response) {
    try {
      const items = await serviceSpacesService.replaceServiceSpaces(
        String(req.params.id),
        req.body as ReplaceServiceSpacesBody,
      )
      res.json({ items })
    } catch (err) {
      if (!handleServiceError(err, res)) throw err
    }
  },
}
