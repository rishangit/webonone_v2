import { Router } from 'express'
import * as membersController from '../controllers/internalCompanyMembers.controller.js'
import { requireServiceKey } from '../middleware/requireServiceKey.js'

const router = Router()

router.get(
  '/internal/companies/:companyId/members',
  requireServiceKey,
  membersController.listCompanyMembersInternal,
)

export default router
