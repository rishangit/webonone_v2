import { Router } from 'express'
import { z } from 'zod'
import * as siteMediaRefsController from '../controllers/siteMediaRefs.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'

const createRefsBodySchema = z.object({
  items: z
    .array(
      z.object({
        mediaId: z.string().length(21),
        mediaUrl: z.string().url().max(1024),
        label: z.string().max(255).nullable().optional(),
      }),
    )
    .min(1),
})

const router = Router()

router.get('/sites/:siteId/media-refs', requireAuth, siteMediaRefsController.listRefs)
router.post(
  '/sites/:siteId/media-refs',
  requireAuth,
  validateBody(createRefsBodySchema),
  siteMediaRefsController.createRefs,
)
router.delete('/sites/:siteId/media-refs/:refId', requireAuth, siteMediaRefsController.deleteRef)

export default router
