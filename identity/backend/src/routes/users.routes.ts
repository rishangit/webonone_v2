import { Router } from 'express'
import { requireServiceKey } from '../middleware/requireServiceKey.js'
import { requireAuth } from '../middleware/validate.js'
import * as internalUsersController from '../controllers/internalUsers.controller.js'
import * as usersController from '../controllers/users.controller.js'

const router = Router()

router.get(
  '/internal/users/:userId/contact',
  requireServiceKey,
  internalUsersController.getUserContactInternal,
)

router.get('/users', requireAuth, usersController.listUsers)
router.get('/users/:id', requireAuth, usersController.getUser)

export default router
