import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { envSchema, EnvConfig } from '../schemas/env.schema.js';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error: unknown) {
  interface ZodErrorLike { format?: () => unknown; message: string; }
  const formatted = error instanceof Error
    ? (error as ZodErrorLike).format?.() ?? error.message
    : String(error);
  console.error('❌ Environment configuration validation failed:', formatted);
  process.exit(1);
}

export { config };
