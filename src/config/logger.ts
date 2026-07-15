import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { config } from './env.js';

export const logger = pino({
  level: config.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  genReqId: (req) => {
    return (req as any).requestId || req.headers['x-request-id'] || 'unknown';
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-internal-service-token"]',
      'req.headers["x-user-id"]',
      'req.headers["x-session-id"]',
      'req.headers["x-robot-id"]',
      'body.password',
      'body.token',
      'body.refreshToken',
      'body.otp',
      'body.credentials',
    ],
    censor: '[REDACTED]',
  },
});
