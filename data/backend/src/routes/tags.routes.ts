import { Router } from 'express'
import * as tagsController from '../controllers/tags.controller.js'
import { requireAuth, requireCompanyAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createTagBodySchema, updateTagBodySchema } from '../schemas/tags.schema.js'

const router = Router()

router.get('/tags', requireAuth, tagsController.listTags)
router.get('/tags/:id', requireAuth, tagsController.getTag)
router.post('/tags', requireAuth, requireCompanyAdminOrSuperAdmin, validateBody(createTagBodySchema), tagsController.createTag)
router.put('/tags/:id', requireAuth, requireSuperAdmin, validateBody(createTagBodySchema), tagsController.updateTag)
router.patch('/tags/:id', requireAuth, requireSuperAdmin, validateBody(updateTagBodySchema), tagsController.updateTag)
router.delete('/tags/:id', requireAuth, requireSuperAdmin, tagsController.deleteTag)

export default router
