import { Router } from 'express'
import * as rolesController from '../controllers/roles.controller.js'
import { requireServiceKey } from '../middleware/requireServiceKey.js'
import { requireAuth } from '../middleware/validate.js'

const router = Router()

router.get('/roles/me/assumable', requireAuth, rolesController.getMyAssumableRoles)

router.get('/internal/roles/user/:userId', requireServiceKey, rolesController.listUserRolesInternal)
router.post('/internal/roles', requireServiceKey, rolesController.insertUserRoleInternal)
router.post('/internal/roles/upsert-super-admin', requireServiceKey, rolesController.upsertSuperAdminInternal)
router.post('/internal/roles/promote-company-admin', requireServiceKey, rolesController.promoteCompanyAdminInternal)
router.post('/internal/roles/demote-member', requireServiceKey, rolesController.demoteMemberInternal)

export default router
