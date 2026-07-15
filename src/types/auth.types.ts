export interface UserAuthContext {
  type: 'user';
  userId: string;
  sessionId: string;
  emailVerified: boolean;
}

export interface RobotAuthContext {
  type: 'robot';
  robotId: string;
}

export type AuthContext = UserAuthContext | RobotAuthContext;

export interface UserJWTPayload {
  sub: string;
  session_id: string;
  email_verified: boolean;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface RobotJWTPayload {
  sub: string;
  token_type: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}
