import { z } from 'zod';

export const userJWTSchema = z.object({
  sub: z.string().uuid(),
  session_id: z.string().uuid(),
  email_verified: z.boolean(),
  iss: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number()
});

export const robotJWTSchema = z.object({
  sub: z.string().uuid(),
  token_type: z.literal('robot'),
  iss: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number()
});
