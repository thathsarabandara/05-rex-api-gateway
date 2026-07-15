import { Request, Response, NextFunction } from 'express';
import { GatewayError } from '../utils/errors.js';
import { sendGatewayError, sendRawError } from '../utils/responses.js';
import { logger } from '../config/logger.js';

/**
 * Global Express error handling middleware to catch unhandled errors
 */
export function errorMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.requestId || '';

  // Prevent logging stack traces for auth or route not found, but log unexpected internal errors
  const isUnexpected = !(error instanceof GatewayError) || error.status >= 500;
  if (isUnexpected) {
    logger.error({ error, requestId, path: req.path, method: req.method }, '[ErrorMiddleware] Unexpected exception caught');
  }

  // If headers were already sent, delegate to standard Express handler
  if (res.headersSent) {
    next(error);
    return;
  }

  // If it's a GatewayError, respond with its status and details
  if (error instanceof GatewayError) {
    return sendGatewayError(res, error, requestId);
  }

  // Handle standard connection issues
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return sendRawError(
      res,
      502,
      'SERVICE_UNAVAILABLE',
      'Downstream service is currently unreachable',
      requestId
    );
  }

  if (error.code === 'ETIMEOUT' || error.status === 504) {
    return sendRawError(
      res,
      504,
      'GATEWAY_TIMEOUT',
      'Downstream service timeout',
      requestId
    );
  }

  // Fallback handler for raw Javascript/Node exceptions
  const status = error.status || error.statusCode || 500;
  const code = error.code || 'INTERNAL_GATEWAY_ERROR';
  const message = error.message || 'Internal gateway error';

  return sendRawError(res, status, code, message, requestId);
}
export default errorMiddleware;
