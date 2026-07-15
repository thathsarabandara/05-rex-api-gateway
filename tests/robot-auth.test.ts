import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

function signUserToken(payload: any) {
  return jwt.sign(payload, config.USER_JWT_SECRET_KEY, { algorithm: config.USER_JWT_ALGORITHM as jwt.Algorithm });
}

function signRobotToken(payload: any) {
  return jwt.sign(payload, config.ROBOT_JWT_SECRET_KEY, { algorithm: config.ROBOT_JWT_ALGORITHM as jwt.Algorithm });
}

describe('Robot Authentication Middleware', () => {
  const validRobotPayload = {
    sub: '5e3df7be-3ab1-4cf4-912a-45c1a79856cd',
    token_type: 'robot',
    iss: config.ROBOT_JWT_ISSUER,
    aud: config.ROBOT_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const validUserPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  it('should accept valid robot token on device routes', async () => {
    const token = signRobotToken(validRobotPayload);
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).not.toBe(401);
  });

  it('should reject requests with missing authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Bearer token required');
  });

  it('should reject requests with malformed header prefix', async () => {
    const token = signRobotToken(validRobotPayload);
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', `Token ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject requests with empty token value', async () => {
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', 'Bearer ')
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject robot token on user routes', async () => {
    const token = signRobotToken(validRobotPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject user token on robot device routes', async () => {
    const token = signUserToken(validUserPayload);
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject robot token with invalid token_type', async () => {
    const invalidPayload = {
      ...validRobotPayload,
      token_type: 'not-robot'
    };
    const token = signRobotToken(invalidPayload);
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject robot token with missing sub', async () => {
    const invalidPayload = {
      ...validRobotPayload
    };
    delete (invalidPayload as any).sub;
    const token = signRobotToken(invalidPayload);
    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });
});
