import { Router } from 'express';
import { notificationProxy } from '../proxies/notification.proxy.js';
import { userAuthMiddleware } from '../middleware/user-auth.middleware.js';
import { internalHeadersMiddleware } from '../middleware/internal-headers.middleware.js';

const router = Router();

// ==================== Protected Notification Management Routes ====================
router.get('/notifications', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.get('/notifications/unread-count', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.get('/notifications/:notificationId', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.patch('/notifications/:notificationId/read', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.patch('/notifications/read-all', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.delete('/notifications/:notificationId', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);

// Preferences
router.get('/preferences', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.put('/preferences', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);

// Deliveries and retries
router.get('/notifications/:notificationId/deliveries', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);
router.post('/notifications/:notificationId/retry', userAuthMiddleware, internalHeadersMiddleware, notificationProxy);

export default router;
