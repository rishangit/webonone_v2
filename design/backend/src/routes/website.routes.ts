import { Router } from 'express'
import * as pages from '../controllers/websitePages.controller.js'
import * as presets from '../controllers/websitePresets.controller.js'
import * as datasets from '../controllers/websiteDatasets.controller.js'
import * as chrome from '../controllers/websiteChrome.controller.js'
import * as layouts from '../controllers/websiteLayout.controller.js'
import * as themes from '../controllers/websiteThemes.controller.js'
import * as pub from '../controllers/websitePublic.controller.js'
import * as settings from '../controllers/websiteSettings.controller.js'
import { requireAuth, requireCompanyContext, requireCompanyContextUnlessSuperAdmin, requireRole } from '../middleware/auth.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import * as library from '../controllers/websiteLibrary.controller.js'
import * as componentLibrary from '../controllers/websiteComponentLibrary.controller.js'
import { validateBody } from '../middleware/validateBody.js'
import { applyDesignCanvasSchema } from '../schemas/websiteCanvas.schema.js'
import * as canvas from '../controllers/websiteCanvas.controller.js'
import { updateWebsiteSettingsSchema } from '../schemas/websiteSettings.schema.js'
import {
  createWebsiteDatasetSchema,
  updateWebsiteDatasetSchema,
} from '../schemas/websiteDatasets.schema.js'

const router = Router()
const companyRoles = ['super_admin', 'company_admin', 'member'] as const
const manageRoles = ['super_admin', 'company_admin'] as const
const libraryReadRoles = ['super_admin', 'company_admin'] as const
const libraryWriteRoles = ['super_admin'] as const

router.get('/public/sites/:companyId', pub.getPublicWebsiteSiteHandler)
router.get(
  '/public/sites/:companyId/datasets/:datasetId/data',
  datasets.getPublicWebsiteDatasetDataHandler,
)

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

router.post(
  '/website/pages/from-library',
  requireAuth,
  requireCompanyContext,
  requireRole('company_admin'),
  componentLibrary.copyLibraryPageHandler,
)
router.post(
  '/website/pages/:id/revert-library',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  componentLibrary.revertLibraryPageHandler,
)
router.post(
  '/website/designer/canvas',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...manageRoles),
  validateBody(applyDesignCanvasSchema),
  canvas.applyDesignCanvasHandler,
)

router.get('/website/pages', requireAuth, requireCompanyContext, requireRole(...companyRoles), pages.listWebsitePagesHandler)
router.get('/website/pages/:id', requireAuth, requireCompanyContext, requireRole(...companyRoles), pages.getWebsitePageHandler)
router.post('/website/pages', requireAuth, requireCompanyContext, requireRole(...manageRoles), pages.createWebsitePageHandler)
router.patch('/website/pages/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), pages.updateWebsitePageHandler)
router.delete('/website/pages/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), pages.deleteWebsitePageHandler)

router.post(
  '/website/presets/from-library',
  requireAuth,
  requireCompanyContext,
  requireRole('company_admin'),
  componentLibrary.copyLibraryPresetHandler,
)
router.post(
  '/website/presets/:id/revert-library',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  componentLibrary.revertLibraryPresetHandler,
)
router.get('/website/presets', requireAuth, requireCompanyContext, requireRole(...companyRoles), presets.listWebsitePresetsHandler)
router.get('/website/presets/:id', requireAuth, requireCompanyContext, requireRole(...companyRoles), presets.getWebsitePresetHandler)
router.post('/website/presets', requireAuth, requireCompanyContext, requireRole(...manageRoles), presets.createWebsitePresetHandler)
router.patch('/website/presets/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), presets.updateWebsitePresetHandler)
router.delete('/website/presets/:id', requireAuth, requireCompanyContext, requireRole(...manageRoles), presets.deleteWebsitePresetHandler)

router.get(
  '/website/datasets/field-catalog',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  datasets.getWebsiteDatasetFieldCatalogHandler,
)
router.get(
  '/website/datasets',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  datasets.listWebsiteDatasetsHandler,
)
router.get(
  '/website/datasets/:id',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  datasets.getWebsiteDatasetHandler,
)
router.post(
  '/website/datasets',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  validateBody(createWebsiteDatasetSchema),
  datasets.createWebsiteDatasetHandler,
)
router.patch(
  '/website/datasets/:id',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  validateBody(updateWebsiteDatasetSchema),
  datasets.updateWebsiteDatasetHandler,
)
router.delete(
  '/website/datasets/:id',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  datasets.deleteWebsiteDatasetHandler,
)
router.post(
  '/website/datasets/:id/preview',
  requireAuth,
  requireCompanyContext,
  requireRole(...companyRoles),
  datasets.previewWebsiteDatasetHandler,
)

router.post(
  '/website/layouts/from-library',
  requireAuth,
  requireCompanyContext,
  requireRole('company_admin'),
  componentLibrary.copyLibraryLayoutHandler,
)
router.post(
  '/website/layouts/:id/revert-library',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  componentLibrary.revertLibraryLayoutHandler,
)
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

router.get(
  '/website/font-library',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...companyRoles),
  library.listFontLibraryHandler,
)
router.post(
  '/website/font-library',
  requireAuth,
  requireRole('super_admin'),
  library.createFontLibraryHandler,
)
router.patch(
  '/website/font-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.updateFontLibraryHandler,
)
router.delete(
  '/website/font-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.deleteFontLibraryHandler,
)

router.get(
  '/website/color-library',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...companyRoles),
  library.listColorLibraryHandler,
)
router.post(
  '/website/color-library',
  requireAuth,
  requireRole('super_admin'),
  library.createColorLibraryHandler,
)
router.patch(
  '/website/color-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.updateColorLibraryHandler,
)
router.delete(
  '/website/color-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.deleteColorLibraryHandler,
)

router.get(
  '/website/text-library',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...companyRoles),
  library.listTextLibraryHandler,
)
router.post(
  '/website/text-library',
  requireAuth,
  requireRole('super_admin'),
  library.createTextLibraryHandler,
)
router.get(
  '/website/text-library/:id',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...companyRoles),
  library.getTextLibraryHandler,
)
router.patch(
  '/website/text-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.updateTextLibraryHandler,
)
router.delete(
  '/website/text-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.deleteTextLibraryHandler,
)

router.get(
  '/website/button-library',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...companyRoles),
  library.listButtonLibraryHandler,
)
router.post(
  '/website/button-library',
  requireAuth,
  requireRole('super_admin'),
  library.createButtonLibraryHandler,
)
router.get(
  '/website/button-library/:id',
  requireAuth,
  requireCompanyContextUnlessSuperAdmin,
  requireRole(...companyRoles),
  library.getButtonLibraryHandler,
)
router.patch(
  '/website/button-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.updateButtonLibraryHandler,
)
router.delete(
  '/website/button-library/:id',
  requireAuth,
  requireRole('super_admin'),
  library.deleteButtonLibraryHandler,
)

const libraryRead = [requireAuth, requireRole(...libraryReadRoles)] as const
const libraryWrite = [requireAuth, requireRole(...libraryWriteRoles)] as const

router.get('/website/library/pages', ...libraryRead, componentLibrary.listLibraryPagesHandler)
router.post('/website/library/pages', ...libraryWrite, componentLibrary.createLibraryPageHandler)
router.get('/website/library/pages/:id', ...libraryRead, componentLibrary.getLibraryPageHandler)
router.patch('/website/library/pages/:id', ...libraryWrite, componentLibrary.updateLibraryPageHandler)
router.delete('/website/library/pages/:id', ...libraryWrite, componentLibrary.deleteLibraryPageHandler)

router.get('/website/library/presets', ...libraryRead, componentLibrary.listLibraryPresetsHandler)
router.post('/website/library/presets', ...libraryWrite, componentLibrary.createLibraryPresetHandler)
router.get('/website/library/presets/:id', ...libraryRead, componentLibrary.getLibraryPresetHandler)
router.patch('/website/library/presets/:id', ...libraryWrite, componentLibrary.updateLibraryPresetHandler)
router.delete('/website/library/presets/:id', ...libraryWrite, componentLibrary.deleteLibraryPresetHandler)

router.get('/website/library/layouts', ...libraryRead, componentLibrary.listLibraryLayoutsHandler)
router.post('/website/library/layouts', ...libraryWrite, componentLibrary.createLibraryLayoutHandler)
router.get('/website/library/layouts/:id', ...libraryRead, componentLibrary.getLibraryLayoutHandler)
router.patch('/website/library/layouts/:id', ...libraryWrite, componentLibrary.updateLibraryLayoutHandler)
router.delete('/website/library/layouts/:id', ...libraryWrite, componentLibrary.deleteLibraryLayoutHandler)

router.get('/website/library/themes', ...libraryRead, componentLibrary.listLibraryThemesHandler)
router.post('/website/library/themes', ...libraryWrite, componentLibrary.createLibraryThemeHandler)
router.get('/website/library/themes/:id', ...libraryRead, componentLibrary.getLibraryThemeHandler)
router.patch('/website/library/themes/:id', ...libraryWrite, componentLibrary.updateLibraryThemeHandler)
router.delete('/website/library/themes/:id', ...libraryWrite, componentLibrary.deleteLibraryThemeHandler)

router.get('/website/library/:kind', ...libraryRead, componentLibrary.listLibraryChromeHandler)
router.post('/website/library/:kind', ...libraryWrite, componentLibrary.createLibraryChromeHandler)
router.get('/website/library/:kind/:id', ...libraryRead, componentLibrary.getLibraryChromeHandler)
router.patch('/website/library/:kind/:id', ...libraryWrite, componentLibrary.updateLibraryChromeHandler)
router.delete('/website/library/:kind/:id', ...libraryWrite, componentLibrary.deleteLibraryChromeHandler)

router.post(
  '/website/headers/from-library',
  requireAuth,
  requireCompanyContext,
  requireRole('company_admin'),
  (req, res, next) => {
    req.params.kind = 'headers'
    componentLibrary.copyLibraryChromeHandler(req, res, next)
  },
)
router.post(
  '/website/footers/from-library',
  requireAuth,
  requireCompanyContext,
  requireRole('company_admin'),
  (req, res, next) => {
    req.params.kind = 'footers'
    componentLibrary.copyLibraryChromeHandler(req, res, next)
  },
)
router.post(
  '/website/:kind/:id/revert-library',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  componentLibrary.revertLibraryChromeHandler,
)

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

router.post(
  '/website-themes/from-library',
  requireAuth,
  requireCompanyContext,
  requireRole('company_admin'),
  componentLibrary.copyLibraryThemeHandler,
)
router.post(
  '/website-themes/:id/revert-library',
  requireAuth,
  requireCompanyContext,
  requireRole(...manageRoles),
  componentLibrary.revertLibraryThemeHandler,
)
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

router.post(
  '/internal/companies/:companyId/website/ensure-starter',
  requireInternalAuth,
  library.ensureStarterWebsiteHandler,
)

export default router
