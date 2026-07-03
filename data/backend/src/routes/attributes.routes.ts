import { Router } from 'express'
import * as attributesController from '../controllers/attributes.controller.js'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createAttributeBodySchema, updateAttributeBodySchema } from '../schemas/attributes.schema.js'

const router = Router()

router.get('/attributes', requireAuth, attributesController.listAttributes)
router.get('/attributes/:id', requireAuth, attributesController.getAttribute)
router.post(
  '/attributes',
  requireAuth,
  requireSuperAdmin,
  validateBody(createAttributeBodySchema),
  attributesController.createAttribute,
)
router.put(
  '/attributes/:id',
  requireAuth,
  requireSuperAdmin,
  validateBody(createAttributeBodySchema),
  attributesController.updateAttribute,
)
router.patch(
  '/attributes/:id',
  requireAuth,
  requireSuperAdmin,
  validateBody(updateAttributeBodySchema),
  attributesController.updateAttribute,
)
router.delete('/attributes/:id', requireAuth, requireSuperAdmin, attributesController.deleteAttribute)

export default router
