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
} catch (error: any) {
  console.error('❌ Environment configuration validation failed:', error.format());
  process.exit(1);
}

export { config };
