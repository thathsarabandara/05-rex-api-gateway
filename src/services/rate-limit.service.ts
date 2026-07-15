import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../config/redis.js';

// Public Auth Limiters
export const registerLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:register',
  points: 5,
  duration: 15 * 60, // 15 minutes
});

export const loginLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:login',
  points: 10,
  duration: 5 * 60, // 5 minutes
});

export const verifyOtpLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:verify_otp',
  points: 10,
  duration: 10 * 60, // 10 minutes
});

export const resendOtpLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:resend_otp',
  points: 3,
  duration: 10 * 60, // 10 minutes
});

export const forgotPasswordLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:forgot_password',
  points: 5,
  duration: 30 * 60, // 30 minutes
});

export const refreshTokenLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:refresh_token',
  points: 30,
  duration: 60 * 60, // 1 hour
});

// Robot Management Limiters (User-based)
export const robotRegisterLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:robot_register',
  points: 5,
  duration: 60 * 60, // 1 hour
});

export const robotClaimLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:robot_claim',
  points: 10,
  duration: 15 * 60, // 15 minutes
});

export const credentialRotationLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:cred_rotate',
  points: 3,
  duration: 60 * 60, // 1 hour
});

export const configUpdateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:config_update',
  points: 10,
  duration: 60, // 1 minute
});

// Emergency Stop Limiter
export const emergencyStopLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:emergency_stop',
  points: 5,
  duration: 1, // 5 requests per second
});

// WebSocket Connection upgrade rate limiting
export const wsConnectionLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:ws_conn',
  points: 10,
  duration: 60, // 10 connections per minute
});

// WebSocket Message Rate Limiters (per user/session, or connection key)
export const joystickLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:ws:joystick',
  points: 30,
  duration: 1, // 30 per second
});

export const armControlLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:ws:arm',
  points: 20,
  duration: 1, // 20 per second
});
