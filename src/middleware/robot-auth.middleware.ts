import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service.js';
import { UnauthorizedError } from '../utils/errors.js';
import { sendGatewayError } from '../utils/responses.js';

/**
 * Enforces robot JWT authentication, mapping verified claims to req.auth
 */
export function robotAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Bearer token required');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Invalid bearer token format');
    }

    const payload = TokenService.verifyRobotToken(token);

    req.auth = {
      type: 'robot',
      robotId: payload.sub,
    };

    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    const err = error instanceof UnauthorizedError ? error : new UnauthorizedError(message);
    return sendGatewayError(res, err, req.requestId || '');
  }
}
export default robotAuthMiddleware;
