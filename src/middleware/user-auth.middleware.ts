import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service.js';
import { UnauthorizedError } from '../utils/errors.js';
import { sendGatewayError } from '../utils/responses.js';

/**
 * Enforces user JWT authentication, mapping verified claims to req.auth
 */
export function userAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Bearer token required');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Invalid bearer token format');
    }

    const payload = TokenService.verifyUserToken(token);

    req.auth = {
      type: 'user',
      userId: payload.sub,
      sessionId: payload.session_id,
      emailVerified: payload.email_verified,
    };

    next();
  } catch (error: any) {
    const err = error instanceof UnauthorizedError ? error : new UnauthorizedError(error.message);
    return sendGatewayError(res, err, req.requestId || '');
  }
}
export default userAuthMiddleware;
