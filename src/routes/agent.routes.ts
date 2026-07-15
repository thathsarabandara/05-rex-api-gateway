import { Router } from 'express';
import { agentProxy } from '../proxies/agent.proxy.js';
import { userAuthMiddleware } from '../middleware/user-auth.middleware.js';
import { internalHeadersMiddleware } from '../middleware/internal-headers.middleware.js';

const router = Router();

// ==================== Protected Agent Routes ====================
router.post('/agent/*path', userAuthMiddleware, internalHeadersMiddleware, agentProxy);
router.get('/agent/*path', userAuthMiddleware, internalHeadersMiddleware, agentProxy);

export default router;
