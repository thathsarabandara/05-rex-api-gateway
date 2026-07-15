import { Router } from 'express';
import { telemetryProxy } from '../proxies/telemetry.proxy.js';
import { userAuthMiddleware } from '../middleware/user-auth.middleware.js';
import { internalHeadersMiddleware } from '../middleware/internal-headers.middleware.js';

const router = Router();

// ==================== Protected Telemetry Routes ====================
router.get('/telemetry/*path', userAuthMiddleware, internalHeadersMiddleware, telemetryProxy);
router.get('/robots/:robotId/telemetry/*path', userAuthMiddleware, internalHeadersMiddleware, telemetryProxy);

export default router;
