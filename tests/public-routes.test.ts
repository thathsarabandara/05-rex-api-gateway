import { describe, it, expect } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import app from '../src/app.js';

describe('Public Routes Routing', () => {
  it('should route /api/v1/auth/login without authentication headers', async () => {
    nock('http://127.0.0.1:8001')
      .post('/api/v1/auth/login')
      .reply(200, { success: true, token: 'mock-session-jwt' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe('mock-session-jwt');
  });

  it('should route /api/v1/password/forgot without authentication headers', async () => {
    nock('http://127.0.0.1:8001')
      .post('/api/v1/password/forgot')
      .reply(200, { success: true, message: 'OTP sent' });

    const res = await request(app)
      .post('/api/v1/password/forgot')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for unmatched public route paths', async () => {
    const res = await request(app)
      .post('/api/v1/auth/invalid-endpoint-path')
      .set('Host', 'localhost');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
