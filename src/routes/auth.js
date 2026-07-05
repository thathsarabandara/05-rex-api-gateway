import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL;

// Forward all requests to the Auth Server
router.use('/', createProxyMiddleware({
  target: AUTH_SERVER_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    return req.originalUrl.replace(/^\/api\/auth/, '/api/auth');
  },
  logLevel: 'debug',
}));

export default router;
