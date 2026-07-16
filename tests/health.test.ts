import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import { Registry } from 'prom-client';
import app from '../src/app.js';
import { HealthService } from '../src/services/health.service.js';
import { redis } from '../src/config/redis.js';

describe('Health and Metrics Endpoints', () => {
  it('should return 200 for liveness probe /health/live', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('alive');
    expect(res.body.service).toBe('rex-api-gateway');
  });

  it('should return 200 for readiness probe /health/ready when services are online', async () => {
    const spyRedis = vi.spyOn(HealthService, 'checkRedis').mockResolvedValueOnce(true);
    const spyServices = vi.spyOn(HealthService, 'getServicesHealth').mockResolvedValueOnce({
      status: 'healthy',
      services: {
        auth: { status: 'healthy', latency_ms: 10 },
        robot: { status: 'healthy', latency_ms: 12 },
        notification: { status: 'healthy', latency_ms: 5 }
      }
    });

    const res = await request(app)
      .get('/health/ready')
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(spyRedis).toHaveBeenCalled();
    expect(spyServices).toHaveBeenCalled();
  });

  it('should return 503 for readiness probe /health/ready when Redis is down', async () => {
    vi.spyOn(HealthService, 'checkRedis').mockResolvedValueOnce(false);
    vi.spyOn(HealthService, 'getServicesHealth').mockResolvedValueOnce({
      status: 'healthy',
      services: {
        auth: { status: 'healthy', latency_ms: 10 },
        robot: { status: 'healthy', latency_ms: 12 },
        notification: { status: 'healthy', latency_ms: 5 }
      }
    });

    const res = await request(app)
      .get('/health/ready')
      .set('Host', 'localhost');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unready');
    expect(res.body.redis).toBe('disconnected');
  });

  it('should return 503 for readiness probe /health/ready when Redis is up but services are degraded', async () => {
    vi.spyOn(HealthService, 'checkRedis').mockResolvedValueOnce(true);
    vi.spyOn(HealthService, 'getServicesHealth').mockResolvedValueOnce({
      status: 'degraded',
      services: {
        auth: { status: 'healthy', latency_ms: 10 },
        robot: { status: 'healthy', latency_ms: 12 },
        notification: { status: 'unavailable', latency_ms: null }
      }
    });

    const res = await request(app)
      .get('/health/ready')
      .set('Host', 'localhost');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unready');
    expect(res.body.redis).toBe('connected');
  });

  it('should return false for checkRedis when ping throws an error', async () => {
    const spy = vi.spyOn(redis, 'ping').mockRejectedValueOnce(new Error('Redis connection lost'));
    const isUp = await HealthService.checkRedis();
    expect(isUp).toBe(false);
    spy.mockRestore();
  });

  it('should return false for checkRedis when ping returns a non-PONG value', async () => {
    const spy = vi.spyOn(redis, 'ping').mockResolvedValueOnce('NOT-PONG' as unknown as 'PONG');
    const isUp = await HealthService.checkRedis();
    expect(isUp).toBe(false);
    spy.mockRestore();
  });

  it('should return service statuses under /health/services', async () => {
    nock('http://127.0.0.1:8001').get('/health/live').reply(200);
    nock('http://127.0.0.1:8002').get('/health/live').reply(200);
    nock('http://127.0.0.1:8003').get('/health/live').reply(500);

    const res = await request(app)
      .get('/health/services')
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.auth.status).toBe('healthy');
    expect(res.body.services.notification.status).toBe('unavailable');
  });

  it('should return 503 status when all downstream services are unavailable', async () => {
    nock('http://127.0.0.1:8001').get('/health/live').reply(500);
    nock('http://127.0.0.1:8002').get('/health/live').reply(500);
    nock('http://127.0.0.1:8003').get('/health/live').reply(500);

    const res = await request(app)
      .get('/health/services')
      .set('Host', 'localhost');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unavailable');
  });

  it('should handle service health check timeouts correctly', async () => {
    nock('http://127.0.0.1:8001').get('/health/live').delay(2500).reply(200);
    nock('http://127.0.0.1:8002').get('/health/live').reply(200);
    nock('http://127.0.0.1:8003').get('/health/live').reply(200);

    const res = await request(app)
      .get('/health/services')
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.auth.status).toBe('unavailable');
  }, 5000);

  it('should return scrape metrics under /metrics', async () => {
    const res = await request(app)
      .get('/metrics')
      .set('Host', 'localhost');

    expect(res.status).toBe(200);
    expect(res.text).toContain('rex_gateway_http_requests_total');
    expect(res.text).toContain('rex_gateway_websocket_connections');
  });

  it('should return 500 when metrics collection throws an error', async () => {
    const originalMetrics = Registry.prototype.metrics;
    Registry.prototype.metrics = () => { throw new Error('Prometheus collection crash'); };

    try {
      const res = await request(app)
        .get('/metrics')
        .set('Host', 'localhost');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Prometheus collection crash');
    } finally {
      Registry.prototype.metrics = originalMetrics;
    }
  });

  it('should return 500 when metrics collection throws a plain string error', async () => {
    const originalMetrics = Registry.prototype.metrics;
    Registry.prototype.metrics = () => { throw 'String error'; };

    try {
      const res = await request(app)
        .get('/metrics')
        .set('Host', 'localhost');

      expect(res.status).toBe(500);
      expect(res.text).toBe('String error');
    } finally {
      Registry.prototype.metrics = originalMetrics;
    }
  });
});
