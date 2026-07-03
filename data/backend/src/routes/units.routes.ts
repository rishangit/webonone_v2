import { Router } from 'express'
import * as unitsController from '../controllers/units.controller.js'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createUnitBodySchema, updateUnitBodySchema } from '../schemas/units.schema.js'

const router = Router()

router.get('/units', requireAuth, unitsController.listUnits)
router.get('/units/:id', requireAuth, unitsController.getUnit)
router.post('/units', requireAuth, requireSuperAdmin, validateBody(createUnitBodySchema), unitsController.createUnit)
router.put('/units/:id', requireAuth, requireSuperAdmin, validateBody(createUnitBodySchema), unitsController.updateUnit)
router.patch('/units/:id', requireAuth, requireSuperAdmin, validateBody(updateUnitBodySchema), unitsController.updateUnit)
router.delete('/units/:id', requireAuth, requireSuperAdmin, unitsController.deleteUnit)

export default router
