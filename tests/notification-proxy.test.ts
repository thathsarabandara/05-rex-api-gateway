import { describe, it, expect } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config/env.js';

function signUserToken(payload: any) {
  return jwt.sign(payload, config.USER_JWT_SECRET_KEY, { algorithm: config.USER_JWT_ALGORITHM as jwt.Algorithm });
}

describe('Notification Service HTTP Proxy Routing', () => {
  const userPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  it('should forward get notifications requests when user is authenticated', async () => {
    const token = signUserToken(userPayload);

    nock('http://127.0.0.1:8003')
      .get('/api/v1/notifications')
      .reply(200, { success: true, data: [] });

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
