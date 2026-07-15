import { Router } from 'express';
import { robotProxy } from '../proxies/robot.proxy.js';
import { userAuthMiddleware } from '../middleware/user-auth.middleware.js';
import { robotAuthMiddleware } from '../middleware/robot-auth.middleware.js';
import { internalHeadersMiddleware } from '../middleware/internal-headers.middleware.js';
import * as limits from '../middleware/rate-limit.middleware.js';

const router = Router();

// ==================== Protected User Robot Management Routes ====================
router.post('/robots/register', userAuthMiddleware, limits.robotRegisterRateLimit, internalHeadersMiddleware, robotProxy);
router.post('/robots/claim', userAuthMiddleware, limits.robotClaimRateLimit, internalHeadersMiddleware, robotProxy);
router.delete('/robots/:robotId/claim', userAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.post('/robots/:robotId/credentials/rotate', userAuthMiddleware, limits.credentialRotationRateLimit, internalHeadersMiddleware, robotProxy);

router.get('/robots', userAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.get('/robots/:robotId', userAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.patch('/robots/:robotId', userAuthMiddleware, internalHeadersMiddleware, robotProxy);

router.get('/robots/:robotId/config', userAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.put('/robots/:robotId/config', userAuthMiddleware, limits.configUpdateRateLimit, internalHeadersMiddleware, robotProxy);
router.get('/robots/:robotId/events', userAuthMiddleware, internalHeadersMiddleware, robotProxy);

router.post('/robots/:robotId/mode', userAuthMiddleware, internalHeadersMiddleware, robotProxy);

// Emergency Stop
router.post('/robots/:robotId/emergency-stop', userAuthMiddleware, limits.emergencyStopRateLimit, internalHeadersMiddleware, robotProxy);
router.post('/robots/:robotId/emergency-stop/release', userAuthMiddleware, internalHeadersMiddleware, robotProxy);

// Control Lease
router.post('/robots/:robotId/control/acquire', userAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.delete('/robots/:robotId/control/release', userAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.get('/robots/:robotId/control/status', userAuthMiddleware, internalHeadersMiddleware, robotProxy);

router.get('/robots/:robotId/commands/:commandId', userAuthMiddleware, internalHeadersMiddleware, robotProxy);

// ==================== Robot Device Routes ====================
router.post('/device/authenticate', internalHeadersMiddleware, robotProxy); // Public to devices
router.post('/device/refresh', internalHeadersMiddleware, robotProxy); // Public to devices
router.post('/device/logout', robotAuthMiddleware, internalHeadersMiddleware, robotProxy);
router.get('/device/config', robotAuthMiddleware, internalHeadersMiddleware, robotProxy);

export default router;
