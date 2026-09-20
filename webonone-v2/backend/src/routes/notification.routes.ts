import { Router } from 'express'
import * as notificationController from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireInternalAuth } from '../middleware/internalAuth.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  pushDeviceBodySchema,
  unregisterPushDeviceBodySchema,
} from '../schemas/notificationSchemas.js'

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
router.put(
  '/notifications/push-devices',
  requireAuth,
  validateBody(pushDeviceBodySchema),
  notificationController.registerMyPushDevice,
)
router.delete(
  '/notifications/push-devices',
  requireAuth,
  validateBody(unregisterPushDeviceBodySchema),
  notificationController.unregisterMyPushDevice,
)

export default router
