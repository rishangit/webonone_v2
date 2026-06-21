import { Router } from 'express'
import * as foldersController from '../controllers/folders.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createFolderBodySchema,
  renameFolderBodySchema,
} from '../schemas/mediaSchemas.js'

const router = Router()

router.post('/folders', requireAuth, validateBody(createFolderBodySchema), foldersController.createFolder)
router.get('/folders', requireAuth, foldersController.listFolders)
router.patch(
  '/folders/:id',
  requireAuth,
  validateBody(renameFolderBodySchema),
  foldersController.renameFolder,
)
router.delete('/folders/:id', requireAuth, foldersController.deleteFolder)

export default router
