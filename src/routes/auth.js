import express from 'express';
import { createProxyMiddleware } from 'express-http-proxy';
import { validateAuthToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL;

// ==================== Public Routes ====================

// POST /api/auth/register/initiate
// Initiate user registration
router.post('/register/initiate', 
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// POST /api/auth/register/verify
// Verify OTP and complete registration
router.post('/register/verify',
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// POST /api/auth/login
// User login
router.post('/login',
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// POST /api/auth/password/forgot
// Initiate password reset
router.post('/password/forgot',
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// POST /api/auth/password/reset
// Reset password with token
router.post('/password/reset',
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// ==================== Protected Routes ====================

// GET /api/auth/token/validate
// Validate current access token
router.get('/token/validate', validateAuthToken,
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// POST /api/auth/token/refresh
// Refresh access token
router.post('/token/refresh',
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// POST /api/auth/logout
// User logout
router.post('/logout', validateAuthToken,
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

// GET /api/auth/profile
// Get current user profile
router.get('/profile', validateAuthToken,
  createProxyMiddleware({
    target: AUTH_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    logLevel: 'debug',
  })
);

export default router;
