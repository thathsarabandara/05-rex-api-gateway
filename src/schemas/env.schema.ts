import { z } from 'zod';

export const envSchema = z.object({
  APP_NAME: z.string().default('rex-api-gateway'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((v) => parseInt(v, 10)).default('8000'),
  LOG_LEVEL: z.string().default('info'),

  REDIS_URL: z.string().url(),

  AUTH_SERVICE_URL: z.string().url(),
  ROBOT_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  TELEMETRY_SERVICE_URL: z.string().url(),
  VISION_SERVICE_URL: z.string().url(),
  EVENT_SERVICE_URL: z.string().url(),
  VOICE_SERVICE_URL: z.string().url(),
  AGENT_SERVICE_URL: z.string().url(),
  MEMORY_SERVICE_URL: z.string().url(),

  USER_JWT_SECRET_KEY: z.string(),
  USER_JWT_ALGORITHM: z.string().default('HS256'),
  USER_JWT_ISSUER: z.string().default('rex-auth-service'),
  USER_JWT_AUDIENCE: z.string().default('rex-platform'),

  ROBOT_JWT_SECRET_KEY: z.string(),
  ROBOT_JWT_ALGORITHM: z.string().default('HS256'),
  ROBOT_JWT_ISSUER: z.string().default('rex-robot-service'),
  ROBOT_JWT_AUDIENCE: z.string().default('rex-device-platform'),

  INTERNAL_SERVICE_TOKEN: z.string(),

  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',').map((o) => o.trim())),
  ALLOWED_HOSTS: z.string().transform((val) => val.split(',').map((h) => h.trim())),

  DEFAULT_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('10000'),
  AUTH_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('10000'),
  ROBOT_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('5000'),
  NOTIFICATION_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('10000'),
  TELEMETRY_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('15000'),
  VISION_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('30000'),
  AGENT_TIMEOUT_MS: z.string().transform((v) => parseInt(v, 10)).default('60000'),

  MAX_JSON_BODY_MB: z.string().transform((v) => parseInt(v, 10)).default('2'),
  MAX_UPLOAD_BODY_MB: z.string().transform((v) => parseInt(v, 10)).default('6'),
  MAX_WEBSOCKET_MESSAGE_KB: z.string().transform((v) => parseInt(v, 10)).default('64'),

  RATE_LIMIT_ENABLED: z.string().transform((val) => val.toLowerCase() === 'true').default('true'),

  GHCR_IMAGE: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
