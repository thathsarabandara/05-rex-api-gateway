import http from 'http';
import { redis } from '../config/redis.js';
import { services } from '../config/services.js';
import { logger } from '../config/logger.js';
import { ServicesHealthResponse, ServiceStatus } from '../types/service.types.js';

export class HealthService {
  /**
   * Pings Redis to check connectivity
   */
  public static async checkRedis(): Promise<boolean> {
    try {
      const ping = await redis.ping();
      return ping === 'PONG';
    } catch (error) {
      logger.error({ error }, '[HealthService] Redis ping failed');
      return false;
    }
  }

  /**
   * Evaluates the health status and latency of downstream services using standard http
   */
  public static async getServicesHealth(): Promise<ServicesHealthResponse> {
    const targets = [
      { key: 'auth', config: services.auth },
      { key: 'robot', config: services.robot },
      { key: 'notification', config: services.notification }
    ];

    const serviceStatuses: Record<string, ServiceStatus> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unavailable' = 'healthy';
    let unavailableCount = 0;

    for (const target of targets) {
      const start = Date.now();
      try {
        const isUp = await new Promise<boolean>((resolve) => {
          const req = http.get(`${target.config.url}/health/live`, { timeout: 2000 }, (res) => {
            resolve(res.statusCode === 200);
          });
          
          req.on('error', () => resolve(false));
          req.on('timeout', () => {
            req.destroy();
            resolve(false);
          });
        });

        const latency = Date.now() - start;

        if (isUp) {
          serviceStatuses[target.key] = {
            status: 'healthy',
            latency_ms: latency
          };
        } else {
          unavailableCount++;
          serviceStatuses[target.key] = {
            status: 'unavailable',
            latency_ms: null
          };
        }
      } catch (error) {
        unavailableCount++;
        serviceStatuses[target.key] = {
          status: 'unavailable',
          latency_ms: null
        };
      }
    }

    if (unavailableCount === targets.length) {
      overallStatus = 'unavailable';
    } else if (unavailableCount > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services: serviceStatuses
    };
  }
}
export default HealthService;
