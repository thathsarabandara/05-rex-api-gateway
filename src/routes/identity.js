import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();
const IDENTITY_SERVER_URL = process.env.IDENTITY_SERVER_URL;

// Forward all requests to the Identity Server
router.use('/', createProxyMiddleware({
  target: IDENTITY_SERVER_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    return req.originalUrl.replace(/^\/api\/identity/, '/api');
  },
  logLevel: 'debug',
}));

export default router;
