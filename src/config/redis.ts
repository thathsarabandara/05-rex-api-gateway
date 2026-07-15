import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from './logger.js';

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    if (times > 3) {
      logger.error(`[Redis] Connection failed after ${times} retries`);
      return null;
    }
    return Math.min(times * 200, 1000);
  },
});

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redis.on('error', (error: any) => {
  logger.error({ error }, '[Redis] Connection error');
});

export { redis };
export default redis;
