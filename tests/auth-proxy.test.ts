import { describe, it, expect } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import app from '../src/app.js';

describe('Auth Service HTTP Proxy Routing', () => {
  it('should forward registration request to auth service', async () => {
    nock('http://127.0.0.1:8001')
      .post('/api/v1/auth/register')
      .reply(201, { success: true, userId: 'uuid-123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Host', 'localhost')
      .send({ email: 'new@example.com', password: 'Password!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBe('uuid-123');
  });

  it('should forward password reset request to auth service', async () => {
    nock('http://127.0.0.1:8001')
      .post('/api/v1/password/reset')
      .reply(200, { success: true, message: 'Password updated' });

    const res = await request(app)
      .post('/api/v1/password/reset')
      .set('Host', 'localhost')
      .send({ token: 'reset-token', password: 'NewPassword!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
