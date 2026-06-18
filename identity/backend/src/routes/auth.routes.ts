import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/validate.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/google', authController.googleLogin)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPasswordHandler)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.post('/code', requireAuth, authController.createAuthCode)
router.post('/exchange', authController.exchange)
router.get('/me', requireAuth, authController.me)
router.patch('/me', requireAuth, authController.patchMe)

export default router
