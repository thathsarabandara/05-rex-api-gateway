import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

function signUserToken(payload: any) {
  return jwt.sign(payload, config.USER_JWT_SECRET_KEY, { algorithm: config.USER_JWT_ALGORITHM as jwt.Algorithm });
}

function signRobotToken(payload: any) {
  return jwt.sign(payload, config.ROBOT_JWT_SECRET_KEY, { algorithm: config.ROBOT_JWT_ALGORITHM as jwt.Algorithm });
}

describe('Internal Headers Middleware and Spoofing Removal', () => {
  const userPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  const robotPayload = {
    sub: '5e3df7be-3ab1-4cf4-912a-45c1a79856cd',
    token_type: 'robot',
    iss: config.ROBOT_JWT_ISSUER,
    aud: config.ROBOT_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  it('should strip client spoofed headers and inject verified ones for User requests', async () => {
    const token = signUserToken(userPayload);

    let capturedHeaders: Record<string, string | string[]> = {};
    nock('http://127.0.0.1:8001')
      .post('/api/v1/auth/logout')
      .reply(function () {
        capturedHeaders = this.req.headers;
        return [200, { success: true }];
      });

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost')
      .set('X-User-Id', 'attacker-id')
      .set('X-Session-Id', 'attacker-session')
      .set('X-Internal-Service-Token', 'hacked-token')
      .set('X-Gateway-Name', 'spoofed-gateway');

    expect(res.status).toBe(200);

    expect(capturedHeaders['x-user-id']).toBe(userPayload.sub);
    expect(capturedHeaders['x-session-id']).toBe(userPayload.session_id);
    expect(capturedHeaders['x-email-verified']).toBe('true');
    expect(capturedHeaders['x-internal-service-token']).toBe(config.INTERNAL_SERVICE_TOKEN);
    expect(capturedHeaders['x-gateway-name']).toBe(config.APP_NAME);
    expect(capturedHeaders['x-request-id']).toBeDefined();
    expect(capturedHeaders['x-request-id']).not.toBe('attacker-id');
  });

  it('should inject verified Robot headers for Device requests', async () => {
    const token = signRobotToken(robotPayload);

    let capturedHeaders: Record<string, string | string[]> = {};
    nock('http://127.0.0.1:8002')
      .get('/api/v1/device/config')
      .reply(function () {
        capturedHeaders = this.req.headers;
        return [200, { ok: true }];
      });

    const res = await request(app)
      .get('/api/v1/device/config')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(capturedHeaders['x-robot-id']).toBe(robotPayload.sub);
    expect(capturedHeaders['x-internal-service-token']).toBe(config.INTERNAL_SERVICE_TOKEN);
    expect(capturedHeaders['x-gateway-name']).toBe(config.APP_NAME);
  });
});
