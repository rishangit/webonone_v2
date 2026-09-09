import { Router } from 'express'
import * as pages from '../controllers/websitePages.controller.js'
import * as chrome from '../controllers/websiteChrome.controller.js'
import * as layouts from '../controllers/websiteLayout.controller.js'
import * as themes from '../controllers/websiteThemes.controller.js'
import * as pub from '../controllers/websitePublic.controller.js'
import * as settings from '../controllers/websiteSettings.controller.js'
import { requireAuth, requireCompanyContext, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateBody.js'
import { updateWebsiteSettingsSchema } from '../schemas/websiteSettings.schema.js'

const router = Router()
const companyRoles = ['super_admin', 'company_admin', 'member'] as const
const manageRoles = ['super_admin', 'company_admin'] as const

router.get('/public/sites/:companyId', pub.getPublicWebsiteSiteHandler)

router.get(
  '/website/live-url',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  pub.getWebsiteLiveUrlHandler,
)

router.get(
  '/website/settings',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  settings.getWebsiteSettingsHandler,
)
router.patch(
  '/website/settings',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  validateBody(updateWebsiteSettingsSchema),
  settings.updateWebsiteSettingsHandler,
)

router.get('/website/pages', requireAuth, requireCompanyContext, requireRole(...companyRoles), pages.listWebsitePagesHandler)
router.get('/website/pages/:id', requireAuth, requireCompanyContext, requireRole(...companyRoles), pages.getWebsitePageHandler)
router.post('/website/pages', requireAuth, requireCompanyContext, requireRole(...manageRoles), pages.createWebsitePageHandler)
router.patch('/website/pages/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), pages.updateWebsitePageHandler)
router.delete('/website/pages/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), pages.deleteWebsitePageHandler)

router.get('/website/layouts', requireAuth, requireCompanyContext, requireRole(...companyRoles), layouts.listWebsiteLayoutsHandler)
router.get('/website/layouts/:id', requireAuth, requireCompanyContext, requireRole(...companyRoles), layouts.getWebsiteLayoutHandler)
router.post('/website/layouts', requireAuth, requireCompanyContext, requireRole(...manageRoles), layouts.createWebsiteLayoutHandler)
router.patch('/website/layouts/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), layouts.updateWebsiteLayoutHandler)
router.post(
  '/website/layouts/:id/default',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  layouts.setDefaultWebsiteLayoutHandler,
)
router.delete('/website/layouts/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), layouts.deleteWebsiteLayoutHandler)

router.get('/website/:kind', requireAuth, requireCompanyContext, requireRole(...companyRoles), chrome.listWebsiteChromeHandler)
router.get('/website/:kind/:id', requireAuth, requireCompanyContext, requireRole(...companyRoles), chrome.getWebsiteChromeHandler)
router.post('/website/:kind', requireAuth, requireCompanyContext, requireRole(...manageRoles), chrome.createWebsiteChromeHandler)
router.patch('/website/:kind/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), chrome.updateWebsiteChromeHandler)
router.post(
  '/website/:kind/:id/default',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  chrome.setDefaultWebsiteChromeHandler,
)
router.delete('/website/:kind/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), chrome.deleteWebsiteChromeHandler)

router.get('/website-themes', requireAuth, requireCompanyContext, requireRole(...companyRoles), themes.listWebsiteThemesHandler)
router.get('/website-themes/:id', requireAuth, requireCompanyContext, requireRole(...companyRoles), themes.getWebsiteThemeHandler)
router.post('/website-themes', requireAuth, requireCompanyContext, requireRole(...manageRoles), themes.createWebsiteThemeHandler)
router.patch('/website-themes/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), themes.updateWebsiteThemeHandler)
router.post(
  '/website-themes/:id/default',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  themes.setDefaultWebsiteThemeHandler,
)
router.delete('/website-themes/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), themes.deleteWebsiteThemeHandler)

export default router
