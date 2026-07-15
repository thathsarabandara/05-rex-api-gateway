import { Router } from 'express';
import { authProxy } from '../proxies/auth.proxy.js';
import { userAuthMiddleware } from '../middleware/user-auth.middleware.js';
import { internalHeadersMiddleware } from '../middleware/internal-headers.middleware.js';
import * as limits from '../middleware/rate-limit.middleware.js';

const router = Router();

// ==================== Public Auth Routes ====================
router.post('/auth/register', limits.registerRateLimit, internalHeadersMiddleware, authProxy);
router.post('/auth/verify-email', limits.verifyOtpRateLimit, internalHeadersMiddleware, authProxy);
router.post('/auth/resend-otp', limits.resendOtpRateLimit, internalHeadersMiddleware, authProxy);
router.post('/auth/login', limits.loginRateLimit, internalHeadersMiddleware, authProxy);
router.post('/auth/refresh', limits.refreshTokenRateLimit, internalHeadersMiddleware, authProxy);

router.post('/password/forgot', limits.forgotPasswordRateLimit, internalHeadersMiddleware, authProxy);
router.post('/password/reset-token/validate', internalHeadersMiddleware, authProxy);
router.post('/password/reset', internalHeadersMiddleware, authProxy);

// ==================== Protected Auth/Profile Routes ====================
router.post('/auth/logout', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.post('/auth/logout-all', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.post('/auth/logout-others', userAuthMiddleware, internalHeadersMiddleware, authProxy);

router.post('/password/change', userAuthMiddleware, internalHeadersMiddleware, authProxy);

router.get('/profile/me', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.patch('/profile/me', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.post('/profile/me/picture', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.delete('/profile/me/picture', userAuthMiddleware, internalHeadersMiddleware, authProxy);

router.get('/sessions', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.delete('/sessions/:sessionId', userAuthMiddleware, internalHeadersMiddleware, authProxy);
router.get('/security/activity', userAuthMiddleware, internalHeadersMiddleware, authProxy);

export default router;
