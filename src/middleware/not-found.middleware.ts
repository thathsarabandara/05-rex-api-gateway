import { Request, Response } from 'express';
import { RouteNotFoundError } from '../utils/errors.js';
import { sendGatewayError } from '../utils/responses.js';

/**
 * Fallback middleware when no route matches the request
 */
export function notFoundMiddleware(req: Request, res: Response) {
  return sendGatewayError(
    res,
    new RouteNotFoundError(`Route ${req.method} ${req.path} not found`),
    req.requestId || ''
  );
}
export default notFoundMiddleware;
