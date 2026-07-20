import { Router } from 'express'
import * as templatesController from '../controllers/templates.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  createTemplateBodySchema,
  previewTemplateBodySchema,
  restoreTemplateBodySchema,
  updateTemplateBodySchema,
} from '../schemas/template.schema.js'

const router = Router()

router.get('/templates', requireAuth, templatesController.getTemplates)
router.get('/templates/:id', requireAuth, templatesController.getTemplate)
router.post(
  '/templates',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(createTemplateBodySchema),
  templatesController.postTemplate,
)
router.put(
  '/templates/:id',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(updateTemplateBodySchema),
  templatesController.putTemplate,
)
router.delete(
  '/templates/:id',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  templatesController.removeTemplate,
)
router.get('/templates/:id/versions', requireAuth, templatesController.getTemplateVersions)
router.post(
  '/templates/:id/restore',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(restoreTemplateBodySchema),
  templatesController.restoreTemplate,
)
router.post(
  '/templates/:id/preview',
  requireAuth,
  requireRole('super_admin', 'company_admin'),
  validateBody(previewTemplateBodySchema),
  templatesController.postTemplatePreview,
)

export default router
