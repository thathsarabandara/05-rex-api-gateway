import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { removeSpoofedHeaders } from '../utils/headers.js';

/**
 * Strips client-supplied internal headers and injects verified gateway context headers
 */
export function internalHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Strip any existing spoofed client headers
  removeSpoofedHeaders(req.headers);

  // Inject common gateway signature and request tracing
  req.headers['x-internal-service-token'] = config.INTERNAL_SERVICE_TOKEN;
  req.headers['x-gateway-name'] = config.APP_NAME;
  req.headers['x-request-id'] = req.requestId || '';

  // If request has been authenticated, inject identity markers
  if (req.auth) {
    if (req.auth.type === 'user') {
      req.headers['x-user-id'] = req.auth.userId;
      req.headers['x-session-id'] = req.auth.sessionId;
      req.headers['x-email-verified'] = String(req.auth.emailVerified);
    } else if (req.auth.type === 'robot') {
      req.headers['x-robot-id'] = req.auth.robotId;
    }
  }

  next();
}
export default internalHeadersMiddleware;
