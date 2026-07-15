import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { ForbiddenError } from '../utils/errors.js';
import { sendGatewayError } from '../utils/responses.js';

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl) which do not send an Origin header
    if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
});

export const hppMiddleware = hpp();

/**
 * Validates that the request Host header matches allowed domains or hosts
 */
export function hostValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.headers.host;
  if (!host) {
    return sendGatewayError(res, new ForbiddenError('Host header is required'), req.requestId || '');
  }

  // Strip port number for hostname validation
  const hostname = host.split(':')[0];

  if (!config.ALLOWED_HOSTS.includes(hostname)) {
    return sendGatewayError(res, new ForbiddenError(`Untrusted host: ${hostname}`), req.requestId || '');
  }

  next();
}
export default {
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  hostValidationMiddleware
};
