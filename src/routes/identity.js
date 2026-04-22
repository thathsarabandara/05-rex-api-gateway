import express from 'express';
import { createProxyMiddleware } from 'express-http-proxy';
import { validateIdentityToken, validateOptionalToken } from '../middleware/auth.js';

const router = express.Router();
const IDENTITY_SERVER_URL = process.env.IDENTITY_SERVER_URL;

// ==================== Public Routes ====================

// POST /api/identity/robots/register
// Register a new robot
router.post('/robots/register',
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/auth/login
// Robot login with fingerprint
router.post('/auth/login',
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/fingerprints/register
// Register device fingerprint
router.post('/fingerprints/register',
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/fingerprints/verify
// Verify device fingerprint
router.post('/fingerprints/verify',
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// ==================== Protected Routes (Robot) ====================

// GET /api/identity/robots/:id
// Get robot details
router.get('/robots/:id', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// PUT /api/identity/robots/:id
// Update robot information
router.put('/robots/:id', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/robots/:id/heartbeat
// Robot heartbeat signal
router.post('/robots/:id/heartbeat', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/robots/:id/activate
// Activate robot
router.post('/robots/:id/activate', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/robots/:id/deactivate
// Deactivate robot
router.post('/robots/:id/deactivate', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// ==================== Device Management ====================

// POST /api/identity/devices/:robot_id/register
// Register device for robot
router.post('/devices/:robot_id/register', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// GET /api/identity/devices/:device_id
// Get device information
router.get('/devices/:device_id', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// PUT /api/identity/devices/:device_id
// Update device information
router.put('/devices/:device_id', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// DELETE /api/identity/devices/:device_id
// Remove device
router.delete('/devices/:device_id', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// ==================== Token Management ====================

// POST /api/identity/auth/refresh
// Refresh robot access token
router.post('/auth/refresh',
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

// POST /api/identity/auth/logout
// Robot logout
router.post('/auth/logout', validateIdentityToken,
  createProxyMiddleware({
    target: IDENTITY_SERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/identity': '/api'
    },
    logLevel: 'debug',
  })
);

export default router;
