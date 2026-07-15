import { config } from './env.js';

export interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
}

export const services: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth-service',
    url: config.AUTH_SERVICE_URL,
    timeout: config.AUTH_TIMEOUT_MS,
  },
  robot: {
    name: 'robot-service',
    url: config.ROBOT_SERVICE_URL,
    timeout: config.ROBOT_TIMEOUT_MS,
  },
  notification: {
    name: 'notification-service',
    url: config.NOTIFICATION_SERVICE_URL,
    timeout: config.NOTIFICATION_TIMEOUT_MS,
  },
  telemetry: {
    name: 'telemetry-service',
    url: config.TELEMETRY_SERVICE_URL,
    timeout: config.TELEMETRY_TIMEOUT_MS,
  },
  vision: {
    name: 'vision-service',
    url: config.VISION_SERVICE_URL,
    timeout: config.VISION_TIMEOUT_MS,
  },
  agent: {
    name: 'agent-service',
    url: config.AGENT_SERVICE_URL,
    timeout: config.AGENT_TIMEOUT_MS,
  },
  memory: {
    name: 'memory-service',
    url: config.MEMORY_SERVICE_URL,
    timeout: config.DEFAULT_TIMEOUT_MS,
  },
  event: {
    name: 'event-service',
    url: config.EVENT_SERVICE_URL,
    timeout: config.DEFAULT_TIMEOUT_MS,
  },
  voice: {
    name: 'voice-service',
    url: config.VOICE_SERVICE_URL,
    timeout: config.DEFAULT_TIMEOUT_MS,
  },
};
