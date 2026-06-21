import { Router } from 'express'
import multer from 'multer'
import * as mediaController from '../controllers/media.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { env } from '../config/env.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeBytes },
})

const router = Router()

router.post('/media/upload', requireAuth, upload.single('file'), mediaController.uploadSingle)
router.post(
  '/media/upload/batch',
  requireAuth,
  upload.array('files', 50),
  mediaController.uploadBatch,
)
router.get('/media', requireAuth, mediaController.listItems)
router.get('/media/:id', requireAuth, mediaController.getItem)
router.delete('/media/:id', requireAuth, mediaController.deleteItem)

export default router
