import { describe, it, expect } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import app from '../src/app.js';

describe('Gateway Downstream Timeouts and Outages', () => {
  it('should return 504 Gateway Timeout when downstream exceeds timeout limit', async () => {
    nock('http://127.0.0.1:8001')
      .post('/api/v1/auth/login')
      .delay(11000) // Delay response beyond default 10s timeout
      .reply(200, { success: true });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(504);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('GATEWAY_TIMEOUT');
  }, 15000); // 15 seconds test timeout

  it('should return 502 Bad Gateway when downstream service is offline', async () => {
    // Shutdown nock interceptors so it fails to connect to 127.0.0.1:8001
    nock.cleanAll();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'localhost')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
