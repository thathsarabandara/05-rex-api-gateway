import { defineConfig } from 'vitest/config';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load .env.test first so all required env vars are present before
// src/config/env.ts is imported by any test file.  CI overrides these
// via the workflow `env:` block; local developers without a real .env
// file will fall back to the committed .env.test placeholders.
dotenvConfig({ path: path.resolve(__dirname, '.env.test'), override: false });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/server.ts',
        'src/types/**/*',
        'src/schemas/**/*',
        'src/services/rate-limit.service.ts',
        'src/config/env.ts',
        'src/config/redis.ts'
      ],
      thresholds: {
        statements: 90,
        branches: 84,
        functions: 90,
        lines: 90
      }
    }
  }
});
