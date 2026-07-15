import { Router } from 'express';
import { visionProxy } from '../proxies/vision.proxy.js';
import { userAuthMiddleware } from '../middleware/user-auth.middleware.js';
import { internalHeadersMiddleware } from '../middleware/internal-headers.middleware.js';

const router = Router();

// ==================== Protected Vision Routes ====================
router.get('/vision/*path', userAuthMiddleware, internalHeadersMiddleware, visionProxy);
router.post('/vision/*path', userAuthMiddleware, internalHeadersMiddleware, visionProxy);

export default router;
