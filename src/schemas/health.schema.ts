import { z } from 'zod';

export const serviceStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unavailable']),
  latency_ms: z.number().nullable()
});

export const servicesHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unavailable']),
  services: z.record(z.string(), serviceStatusSchema)
});

export const livenessResponseSchema = z.object({
  status: z.literal('alive'),
  service: z.string()
});
