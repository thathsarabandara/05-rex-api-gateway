import { Request, Response, NextFunction } from 'express';
import { RateLimiterAbstract } from 'rate-limiter-flexible';
import { config } from '../config/env.js';
import { RateLimitExceededError } from '../utils/errors.js';
import { sendGatewayError } from '../utils/responses.js';
import { logger } from '../config/logger.js';
import * as limiters from '../services/rate-limit.service.js';

// Base helper to build rate limiter middleware
function makeMiddleware(limiter: RateLimiterAbstract, keyGen: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.RATE_LIMIT_ENABLED) {
      next();
      return;
    }

    const key = keyGen(req);

    try {
      const result = await limiter.consume(key);

      res.setHeader('X-RateLimit-Limit', limiter.points);
      res.setHeader('X-RateLimit-Remaining', result.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString());

      next();
    } catch (rejected: any) {
      if (rejected instanceof Error) {
        // Log Redis connection error but fail open to keep service operational
        logger.error({ error: rejected, key }, '[RateLimiter] Redis connection failure - failing open');
        next();
        return;
      }

      res.setHeader('X-RateLimit-Limit', limiter.points);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rejected.msBeforeNext).toISOString());
      res.setHeader('Retry-After', Math.ceil(rejected.msBeforeNext / 1000));

      return sendGatewayError(
        res,
        new RateLimitExceededError('Too many requests, please try again later.'),
        req.requestId || ''
      );
    }
  };
}

// IP Key Generator
const getIpKey = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';

// User Key Generator
const getUserKey = (req: Request) => {
  if (req.auth && req.auth.type === 'user') {
    return req.auth.userId;
  }
  return req.ip || 'unknown';
};

// Robot Claim: Attempts per user AND IP
const getRobotClaimKey = (req: Request) => {
  const ip = req.ip || 'unknown';
  const userId = req.auth && req.auth.type === 'user' ? req.auth.userId : 'anonymous';
  return `${userId}:${ip}`;
};

// Middlewares
export const registerRateLimit = makeMiddleware(limiters.registerLimiter, getIpKey);
export const loginRateLimit = makeMiddleware(limiters.loginLimiter, getIpKey);
export const verifyOtpRateLimit = makeMiddleware(limiters.verifyOtpLimiter, getIpKey);
export const resendOtpRateLimit = makeMiddleware(limiters.resendOtpLimiter, getIpKey);
export const forgotPasswordRateLimit = makeMiddleware(limiters.forgotPasswordLimiter, getIpKey);
export const refreshTokenRateLimit = makeMiddleware(limiters.refreshTokenLimiter, getIpKey);

export const robotRegisterRateLimit = makeMiddleware(limiters.robotRegisterLimiter, getUserKey);
export const robotClaimRateLimit = makeMiddleware(limiters.robotClaimLimiter, getRobotClaimKey);
export const credentialRotationRateLimit = makeMiddleware(limiters.credentialRotationLimiter, getUserKey);
export const configUpdateRateLimit = makeMiddleware(limiters.configUpdateLimiter, getUserKey);

export const emergencyStopRateLimit = makeMiddleware(limiters.emergencyStopLimiter, getUserKey);
