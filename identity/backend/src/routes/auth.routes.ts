import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/validate.js'

const router = Router()

router.post('/register/request-email-otp', authController.requestRegisterEmailOtpHandler)
router.post('/register/verify-email-otp', authController.verifyRegisterEmailOtpHandler)
router.post('/register/complete', authController.completeRegistrationHandler)
router.post('/login', authController.login)
router.post('/google', authController.googleLogin)
router.post('/forgot-password', authController.forgotPassword)
router.post('/verify-reset-otp', authController.verifyResetOtpHandler)
router.post('/reset-password', authController.resetPasswordHandler)
router.post('/resend-verification', authController.resendVerification)
router.post('/verify-email', authController.verifyEmailHandler)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.post('/logout-all', requireAuth, authController.logoutAll)
router.post('/session-role', requireAuth, authController.sessionRoleHandler)
router.post('/impersonate', requireAuth, authController.impersonateHandler)
router.post('/stop-impersonate', requireAuth, authController.stopImpersonateHandler)
router.post('/code', requireAuth, authController.createAuthCode)
router.post('/exchange', authController.exchange)
router.get('/me', requireAuth, authController.me)
router.patch('/me', requireAuth, authController.patchMe)
router.post('/me/email/request-otp', requireAuth, authController.requestProfileEmailOtpHandler)
router.post('/me/email/verify-otp', requireAuth, authController.verifyProfileEmailOtpHandler)
router.post('/me/phone/request-otp', requireAuth, authController.requestProfilePhoneOtpHandler)
router.post('/me/phone/verify-otp', requireAuth, authController.verifyProfilePhoneOtpHandler)

export default router
