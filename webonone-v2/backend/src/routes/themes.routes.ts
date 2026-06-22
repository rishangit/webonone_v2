import { Router } from 'express'
import * as themesController from '../controllers/themes.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { createThemeBodySchema, updateThemeBodySchema } from '../schemas/themeSchemas.js'

const router = Router()

router.get('/themes', requireAuth, themesController.listThemes)
router.post('/themes', requireAuth, validateBody(createThemeBodySchema), themesController.createTheme)
router.get('/themes/:id', requireAuth, themesController.getTheme)
router.patch('/themes/:id', requireAuth, validateBody(updateThemeBodySchema), themesController.updateTheme)
router.delete('/themes/:id', requireAuth, themesController.deleteTheme)

export default router
