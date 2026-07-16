import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import app from '../src/app.js';
import * as limiters from '../src/services/rate-limit.service.js';
import { robotRegisterRateLimit } from '../src/middleware/rate-limit.middleware.js';
import { config } from '../src/config/env.js';
import { signUserToken } from './helpers.js';

describe('Rate Limiting Middleware', () => {
  const userPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'session-uuid',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  it('should allow requests under the limit', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com' });

    expect(res.status).not.toBe(429);
  });

  it('should reject requests exceeding limits returning 429 and standard rate headers', async () => {
    vi.mocked(limiters.loginLimiter.consume).mockRejectedValueOnce({
      remainingPoints: 0,
      msBeforeNext: 8000
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(429);
    expect(res.header['x-ratelimit-remaining']).toBe('0');
    expect(res.header['retry-after']).toBe('8');
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should ensure emergency stop uses a separate rate limiter scope', async () => {
    vi.mocked(limiters.loginLimiter.consume).mockRejectedValueOnce({
      remainingPoints: 0,
      msBeforeNext: 5000
    });

    const resLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost');
    expect(resLogin.status).toBe(429);

    const resEmergency = await request(app)
      .post('/api/v1/robots/123-robot-id/emergency-stop')
      .set('Host', 'localhost');
    expect(resEmergency.status).toBe(401);
  });

  it('should fail-open when rate-limiter throws a connection Error', async () => {
    vi.mocked(limiters.loginLimiter.consume).mockRejectedValueOnce(new Error('Redis connection lost'));

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com' });

    expect(res.status).not.toBe(429);
  });

  it('should bypass limiting when RATE_LIMIT_ENABLED is false', async () => {
    config.RATE_LIMIT_ENABLED = false;

    vi.mocked(limiters.loginLimiter.consume).mockRejectedValueOnce({ remainingPoints: 0, msBeforeNext: 1000 });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost');

    expect(res.status).not.toBe(429);

    config.RATE_LIMIT_ENABLED = true; // Restore
  });

  it('should fallback to IP for getUserKey when req.auth is missing', async () => {
    const req = {
      ip: '127.0.0.1',
      socket: {},
      headers: {}
    } as import('express').Request;
    const res = {
      setHeader: vi.fn(),
    } as unknown as import('express').Response;
    const next = vi.fn();

    await robotRegisterRateLimit(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should exercise other rate limiter middleware endpoints', async () => {
    const token = signUserToken(userPayload);
    
    nock('http://127.0.0.1:8001').post('/api/v1/auth/register').reply(200);
    nock('http://127.0.0.1:8001').post('/api/v1/auth/verify-email').reply(200);
    nock('http://127.0.0.1:8001').post('/api/v1/auth/resend-otp').reply(200);
    nock('http://127.0.0.1:8001').post('/api/v1/auth/refresh').reply(200);
    nock('http://127.0.0.1:8001').post('/api/v1/password/forgot').reply(200);

    nock('http://127.0.0.1:8002').post('/api/v1/robots/register').reply(200);
    nock('http://127.0.0.1:8002').post('/api/v1/robots/claim').reply(200);
    nock('http://127.0.0.1:8002').post('/api/v1/robots/123/credentials/rotate').reply(200);
    nock('http://127.0.0.1:8002').put('/api/v1/robots/123/config').reply(200);

    const requests = [
      request(app).post('/api/v1/auth/register').set('Host', 'localhost').send({ email: 'new@example.com' }),
      request(app).post('/api/v1/auth/verify-email').set('Host', 'localhost'),
      request(app).post('/api/v1/auth/resend-otp').set('Host', 'localhost'),
      request(app).post('/api/v1/auth/refresh').set('Host', 'localhost'),
      request(app).post('/api/v1/password/forgot').set('Host', 'localhost'),
      
      request(app).post('/api/v1/robots/register').set('Authorization', `Bearer ${token}`).set('Host', 'localhost'),
      request(app).post('/api/v1/robots/claim').set('Authorization', `Bearer ${token}`).set('Host', 'localhost'),
      request(app).post('/api/v1/robots/123/credentials/rotate').set('Authorization', `Bearer ${token}`).set('Host', 'localhost'),
      request(app).put('/api/v1/robots/123/config').set('Authorization', `Bearer ${token}`).set('Host', 'localhost')
    ];

    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });
});
