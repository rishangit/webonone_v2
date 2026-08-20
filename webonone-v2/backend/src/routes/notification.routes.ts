import { Router } from 'express'
import * as notificationController from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'

const router = Router()

router.post(
  '/internal/notifications',
  requireInternalAuth,
  notificationController.createInternalNotification,
)

router.get('/notifications', requireAuth, notificationController.listMyNotifications)
router.get('/notifications/unread-count', requireAuth, notificationController.getMyUnreadCount)
router.patch(
  '/notifications/:id/read',
  requireAuth,
  notificationController.markMyNotificationRead,
)
router.post(
  '/notifications/read-all',
  requireAuth,
  notificationController.markAllMyNotificationsRead,
)

export default router
