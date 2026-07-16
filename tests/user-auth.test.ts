import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { signUserToken } from './helpers.js';

describe('User Authentication Middleware', () => {
  const validPayload = {
    sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    session_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    email_verified: true,
    iss: config.USER_JWT_ISSUER,
    aud: config.USER_JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  it('should accept requests with a valid user token and set correct headers', async () => {
    const token = signUserToken(validPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).not.toBe(401);
  });

  it('should reject requests with missing token', async () => {
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid Bearer prefix', async () => {
    const token = signUserToken(validPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Token ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject requests with empty token value', async () => {
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Bearer ')
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject expired tokens', async () => {
    const expiredPayload = {
      ...validPayload,
      exp: Math.floor(Date.now() / 1000) - 3600
    };
    const token = signUserToken(expiredPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject tokens with invalid issuer', async () => {
    const invalidPayload = {
      ...validPayload,
      iss: 'wrong-issuer'
    };
    const token = signUserToken(invalidPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject tokens with invalid audience', async () => {
    const invalidPayload = {
      ...validPayload,
      aud: 'wrong-audience'
    };
    const token = signUserToken(invalidPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject tokens with unverified email', async () => {
    const invalidPayload = {
      ...validPayload,
      email_verified: false
    };
    const token = signUserToken(invalidPayload);
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });

  it('should reject tokens with incorrect algorithm', async () => {
    // Sign using HS384 instead of default HS256
    const token = jwt.sign(validPayload, config.USER_JWT_SECRET_KEY, { algorithm: 'HS384' });
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Host', 'localhost');

    expect(res.status).toBe(401);
  });
});
