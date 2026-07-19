import { Router } from 'express'
import { requireAuth } from '../middleware/validate.js'
import * as usersController from '../controllers/users.controller.js'

const router = Router()

router.get('/users', requireAuth, usersController.listUsers)

export default router
