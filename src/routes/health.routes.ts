import { Router } from 'express';
import { HealthService } from '../services/health.service.js';
import { register, serviceHealthGauge } from '../utils/metrics.js';

const router = Router();

// ==================== Liveness Endpoint ====================
router.get('/health/live', (_req, res) => {
  res.json({
    status: 'alive',
    service: 'rex-api-gateway'
  });
});

// ==================== Readiness Endpoint ====================
router.get('/health/ready', async (req, res) => {
  const redisConnected = await HealthService.checkRedis();
  const servicesHealth = await HealthService.getServicesHealth();

  const ready = redisConnected && servicesHealth.status === 'healthy';

  if (ready) {
    res.json({
      status: 'ready',
      service: 'rex-api-gateway'
    });
  } else {
    res.status(503).json({
      status: 'unready',
      service: 'rex-api-gateway',
      redis: redisConnected ? 'connected' : 'disconnected',
      services: servicesHealth.services
    });
  }
});

// ==================== Service Status Endpoint ====================
router.get('/health/services', async (req, res) => {
  const servicesHealth = await HealthService.getServicesHealth();

  // Expose status metrics for prometheus scraping
  for (const [name, details] of Object.entries(servicesHealth.services)) {
    serviceHealthGauge.set({ service_name: name }, details.status === 'healthy' ? 1 : 0);
  }

  // 503 only if everything is down, otherwise 200 degraded
  const statusCode = servicesHealth.status === 'unavailable' ? 503 : 200;
  res.status(statusCode).json(servicesHealth);
});

// ==================== Prometheus Metrics Endpoint ====================
router.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).end(message || error);
  }
});

export default router;
