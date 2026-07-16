import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

export interface UserJwtPayload {
  sub: string;
  session_id: string;
  email_verified: boolean;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface RobotJwtPayload {
  sub?: string;
  token_type: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export function signUserToken(payload: UserJwtPayload): string {
  return jwt.sign(payload, config.USER_JWT_SECRET_KEY, { algorithm: config.USER_JWT_ALGORITHM as jwt.Algorithm });
}

export function signRobotToken(payload: RobotJwtPayload): string {
  return jwt.sign(payload, config.ROBOT_JWT_SECRET_KEY, { algorithm: config.ROBOT_JWT_ALGORITHM as jwt.Algorithm });
}
