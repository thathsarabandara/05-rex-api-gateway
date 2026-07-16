import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import type { ClientRequest, IncomingMessage, ServerResponse } from 'http';
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
export function handleProxyReq(proxyReq: ClientRequest, req: Request, serviceName: string) {
  logger.debug(
    { serviceName, method: req.method, path: req.path, requestId: req.requestId },
    '[Proxy] Routing HTTP request'
  );

  if (req.body) {
    fixRequestBody(proxyReq, req);
  }
}

/**
 * Shared error handling logic for microservice proxies
 */
export function handleProxyError(error: Error & { code?: string }, req: Request, res: ServerResponse | Response, serviceName: string) {
  const requestId = req.requestId || '';
  logger.error(
    { error, serviceName, path: req.path, requestId },
    '[Proxy Error] Request proxy forwarding failed'
  );

  if ((res as ServerResponse).headersSent) {
    return;
  }

  // Return standard 502/504 error depending on internal connection failure
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return sendRawError(
      res as Response,
      502,
      'SERVICE_UNAVAILABLE',
      'Downstream service is currently unreachable',
      requestId
    );
  }

  if (error.code === 'ETIMEOUT' || error.code === 'ECONNRESET') {
    return sendRawError(
      res as Response,
      504,
      'GATEWAY_TIMEOUT',
      'Downstream service timeout',
      requestId
    );
  }

  return sendRawError(
    res as Response,
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
      proxyReq: (proxyReq, req) => {
        handleProxyReq(proxyReq, req as unknown as Request, serviceName);
      },
      error: (error, req, res) => {
        handleProxyError(error, req as unknown as Request, res as ServerResponse, serviceName);
      },
      proxyRes: (proxyRes, req) => {
        logger.debug(
          { serviceName, statusCode: proxyRes.statusCode, requestId: (req as unknown as Request).requestId },
          '[Proxy Response] Routed HTTP response received'
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
