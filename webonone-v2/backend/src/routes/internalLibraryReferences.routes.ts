import { Router } from 'express'
import * as internalLibraryReferencesController from '../controllers/internalLibraryReferences.controller.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import { libraryEntityReferenceCountsBodySchema } from '../schemas/internalLibraryReferences.schema.js'

const router = Router()

router.post(
  '/internal/library-entity-reference-counts',
  requireInternalAuth,
  validateBody(libraryEntityReferenceCountsBodySchema),
  internalLibraryReferencesController.postLibraryEntityReferenceCounts,
)

export default router
