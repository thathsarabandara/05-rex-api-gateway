import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserJWTPayload, RobotJWTPayload } from '../types/auth.types.js';
import { UnauthorizedError } from '../utils/errors.js';

export class TokenService {
  /**
   * Verifies a User JWT with strict claims validation
   */
  public static verifyUserToken(token: string): UserJWTPayload {
    try {
      const payload = jwt.verify(token, config.USER_JWT_SECRET_KEY, {
        algorithms: [config.USER_JWT_ALGORITHM as jwt.Algorithm],
        issuer: config.USER_JWT_ISSUER,
        audience: config.USER_JWT_AUDIENCE,
      }) as UserJWTPayload;

      if (!payload.sub) {
        throw new UnauthorizedError('Invalid token subject');
      }

      if (payload.email_verified !== true) {
        throw new UnauthorizedError('Email not verified');
      }

      return payload;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid user token';
      throw new UnauthorizedError(message);
    }
  }

  /**
   * Verifies a Robot JWT with strict claims validation
   */
  public static verifyRobotToken(token: string): RobotJWTPayload {
    try {
      const payload = jwt.verify(token, config.ROBOT_JWT_SECRET_KEY, {
        algorithms: [config.ROBOT_JWT_ALGORITHM as jwt.Algorithm],
        issuer: config.ROBOT_JWT_ISSUER,
        audience: config.ROBOT_JWT_AUDIENCE,
      }) as RobotJWTPayload;

      if (!payload.sub) {
        throw new UnauthorizedError('Invalid token subject');
      }

      if (payload.token_type !== 'robot') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid robot token';
      throw new UnauthorizedError(message);
    }
  }
}
export default TokenService;
