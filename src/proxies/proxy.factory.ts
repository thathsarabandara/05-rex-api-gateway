import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { sendRawError } from '../utils/responses.js';

export interface ServiceProxyOptions {
  serviceName: string;
  target: string;
  timeoutMs: number;
}

/**
 * Shared proxy request listener that fixes body payload formatting
 */
export function handleProxyReq(proxyReq: any, req: Request, serviceName: string) {
  logger.debug(
    { serviceName, method: req.method, path: req.path, requestId: req.requestId },
    `[Proxy] Routing HTTP request`
  );

  if (req.body) {
    fixRequestBody(proxyReq, req);
  }
}

/**
 * Shared error handling logic for microservice proxies
 */
export function handleProxyError(error: any, req: Request, res: any, serviceName: string) {
  const requestId = req.requestId || '';
  logger.error(
    { error, serviceName, path: req.path, requestId },
    `[Proxy Error] Request proxy forwarding failed`
  );

  if (res.headersSent) {
    return;
  }

  // Return standard 502/504 error depending on internal connection failure
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return sendRawError(
      res,
      502,
      'SERVICE_UNAVAILABLE',
      'Downstream service is currently unreachable',
      requestId
    );
  }

  if (error.code === 'ETIMEOUT' || error.code === 'ECONNRESET') {
    return sendRawError(
      res,
      504,
      'GATEWAY_TIMEOUT',
      'Downstream service timeout',
      requestId
    );
  }

  return sendRawError(
    res,
    502,
    'SERVICE_UNAVAILABLE',
    'Downstream service communication failure',
    requestId
  );
}

/**
 * Factory function creating an HTTP proxy middleware for downstream microservices
 */
export function createServiceProxy(options: ServiceProxyOptions) {
  const { serviceName, target, timeoutMs } = options;

  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: timeoutMs,
    timeout: timeoutMs,
    on: {
      proxyReq: (proxyReq, req: Request) => {
        handleProxyReq(proxyReq, req, serviceName);
      },
      error: (error: any, req: Request, res: any) => {
        handleProxyError(error, req, res, serviceName);
      },
      proxyRes: (proxyRes, req: Request) => {
        logger.debug(
          { serviceName, statusCode: proxyRes.statusCode, requestId: req.requestId },
          `[Proxy Response] Routed HTTP response received`
        );
      }
    }
  });

  return (req: Request, res: Response, next: NextFunction) => {
    req.url = req.originalUrl;
    proxy(req, res, next);
  };
}
export default createServiceProxy;
