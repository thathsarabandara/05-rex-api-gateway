import { describe, it, expect } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

function signUserToken(payload: any) {
  return jwt.sign(payload, config.USER_JWT_SECRET_KEY, { algorithm: config.USER_JWT_ALGORITHM as jwt.Algorithm });
}

describe('Robot Service HTTP Proxy Routing', () => {
  const userPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  it('should forward claim robot request to robot service when authenticated', async () => {
    const token = signUserToken(userPayload);

    nock('http://127.0.0.1:8002')
      .post('/api/v1/robots/claim')
      .reply(200, { success: true, robotId: 'robot-999' });

    const res = await request(app)
      .post('/api/v1/robots/claim')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost')
      .send({ claimCode: 'CODE123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.robotId).toBe('robot-999');
  });

  it('should forward device authenticating to robot service without auth token', async () => {
    nock('http://127.0.0.1:8002')
      .post('/api/v1/device/authenticate')
      .reply(200, { token: 'robot-device-token' });

    const res = await request(app)
      .post('/api/v1/device/authenticate')
      .set('Host', 'localhost')
      .send({ serialNumber: 'SN-0001' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('robot-device-token');
  });
});
